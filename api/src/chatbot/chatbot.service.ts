import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { DoctorQueueService } from '../doctor-queue/doctor-queue.service';
import { firstValueFrom } from 'rxjs';

type RagResult = {
  reply: string;
  confidence: string;
  sources: string[];
  queueForDoctor?: boolean;
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly mlBaseUrl: string;

  private readonly THRESHOLDS = {
    WEIGHT: { MIN: 35, MAX: 150 },
    HEIGHT: { MIN: 120, MAX: 215 },
    PREGNANCY_WEEK: { MAX: 42 },
    BABY_AGE_MONTHS: { MAX: 60 },
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly doctorQueue: DoctorQueueService,
    private readonly config: ConfigService,
  ) {
    this.mlBaseUrl =
      this.config.get<string>('ML_SERVICE_URL') ?? 'http://127.0.0.1:5000';
  }

  async processUserMessage(userId: string, message: string) {
    try {
      const approved = await this.doctorQueue.getApprovedAnswer(message);
      if (approved) {
        return {
          reply: approved.answer,
          needsConfirmation: false,
          source: 'approved',
          confidence: 'auto_safe',
          sources: approved.sources,
        };
      }

      let extracted: Record<string, unknown>;
      try {
        const mlResponse = await firstValueFrom(
          this.httpService.post(
            `${this.mlBaseUrl}/extract`,
            { text: message },
            { timeout: 8000 }, // ← increased from 5000: cold-start ML can take 5-7s
          ),
        );
        extracted = mlResponse.data as Record<string, unknown>;
      } catch (mlError) {
        this.logger.warn(
          `ML service unavailable, using empty extraction: ${(mlError as Error).message}`,
        );
        extracted = {
          weight: null,
          height: null,
          pregnancyWeek: null,
          babyAgeMonths: null,
          conditions: [],
          name: null,
          weight_value: null,
          height_value: null,
        };
      }

      const validation = this.validateExtractedData(extracted);
      if (!validation.isValid) {
        return {
          reply: validation.errorMessage,
          needsConfirmation: true,
          confidence: 'auto_safe', // NOT requires_doctor — this is a clarification, not an emergency
          sources: [],
        };
      }

      await this.saveDataToPrisma(userId, extracted);

      let user: {
        id: string;
        name: string;
        dueDate: Date | null;
        babyBirthDate: Date | null;
        weight: number | null;
        height: number | null;
        deliveryType: string | null;
      } | null = null;

      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            dueDate: true,
            babyBirthDate: true,
            babyName: true,
            deliveryType: true,
            weight: true,
            height: true,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Prisma error fetching user: ${(err as Error).message}`,
        );
      }

      if (!user) throw new NotFoundException('User not found');

      const vitals = await this.userHasVitals(userId, extracted, user);

      const onboardingComplete =
        user.name &&
        !user.name.toLowerCase().includes('guest') &&
        (user.dueDate ||
          user.babyBirthDate ||
          extracted.pregnancyWeek ||
          extracted.babyAgeMonths) &&
        vitals.hasWeight &&
        vitals.hasHeight;

      if (onboardingComplete) {
        const ragResult = await this.getRAGResponse(
          message,
          extracted,
          user,
          userId,
        );
        if (ragResult) {
          if (
            ragResult.queueForDoctor ||
            ragResult.confidence === 'requires_doctor'
          ) {
            await this.queueDoctorReview(userId, message, ragResult);
          }

          return {
            reply: ragResult.reply,
            extractedData: extracted,
            needsConfirmation: false,
            source: 'rag',
            confidence: ragResult.confidence,
            sources: ragResult.sources,
          };
        }
      }

      return {
        reply: this.generateSmartReply(user, extracted, message),
        extractedData: extracted,
        needsConfirmation: false,
        source: 'onboarding',
        confidence: 'auto_safe',
        sources: [],
      };
    } catch (error) {
      this.logger.error(`ML Service Error: ${(error as Error).message}`);
      return {
        reply:
          'Amma is having a little trouble right now. Please try again later. For urgent concerns, call NHM helpline: 104.',
        confidence: 'requires_doctor',
        sources: [],
      };
    }
  }

  private async queueDoctorReview(
    userId: string,
    message: string,
    ragResult: RagResult,
  ) {
    try {
      const contentRequest = await this.prisma.contentRequest.create({
        data: {
          requestType: 'GENERAL_QUESTION',
          uploadedById: userId,
          questionText: message,
          context: {
            category: 'general',
            sources: ragResult.sources,
            confidence: ragResult.confidence,
          },
          mlResponse: ragResult.reply,
          status: 'PENDING',
        },
      });

      await this.doctorQueue.queueForReview({
        contentRequestId: contentRequest.id,
        originalAnswer: ragResult.reply,
        category: 'general',
        confidence: ragResult.confidence,
      });
    } catch (err) {
      this.logger.warn(`Doctor queue failed: ${(err as Error).message}`);
    }
  }

  private generateSmartReply(
    user: {
      name: string;
      dueDate: Date | null;
      babyBirthDate: Date | null;
      weight?: number | null;
      height?: number | null;
    },
    extracted: Record<string, unknown>,
    originalMessage: string,
  ): string {
    const hasName =
      (user.name &&
        !user.name.toLowerCase().includes('guest') &&
        !user.name.toLowerCase().includes('user')) ||
      extracted.name;
    const hasStage =
      user.dueDate ||
      user.babyBirthDate ||
      extracted.pregnancyWeek ||
      extracted.babyAgeMonths;
    const hasWeight = user.weight || extracted.weight_value;
    const hasHeight = user.height || extracted.height_value;

    const nameToUse = (extracted.name as string) || user.name || 'friend';

    if (!hasName) {
      return `Namaste! I've noted that, but what should I call you?`;
    }

    if (!hasStage) {
      return `Glad to meet you, ${nameToUse}! To support you better, are you currently pregnant or a new mother?`;
    }

    if (!hasWeight || !hasHeight) {
      const missing =
        !hasWeight && !hasHeight
          ? 'weight and height'
          : !hasWeight
            ? 'weight'
            : 'height';
      return `Got it, ${nameToUse}. For accurate health tracking, could you please share your ${missing}?`;
    }

    if (
      Array.isArray(extracted.conditions) &&
      extracted.conditions.length > 0
    ) {
      return `I've noted the ${(extracted.conditions as string[]).join(', ')}. It's important to monitor this. Are you currently taking any supplements or under a doctor's care for this?`;
    }

    if (
      originalMessage.toLowerCase().includes('good') ||
      originalMessage.toLowerCase().includes('fine')
    ) {
      return `That's wonderful to hear, ${nameToUse}! I'm here if you have questions about your nutrition, recovery, or baby care. What's on your mind?`;
    }

    return `I've updated your profile, ${nameToUse}. How are you feeling today? Any specific concerns I can help with?`;
  }

  private validateExtractedData(data: Record<string, unknown>) {
    const weight = data.weight_value as number | undefined;
    const height = data.height_value as number | undefined;

    if (weight) {
      if (weight < this.THRESHOLDS.WEIGHT.MIN) {
        return {
          isValid: false,
          errorMessage: `I caught ${weight}kg. Is that your weight, or the baby's? It seems a bit low for an adult!`,
        };
      }
      if (weight > this.THRESHOLDS.WEIGHT.MAX) {
        return {
          isValid: false,
          errorMessage: `Just confirming: did you say ${weight}kg? I want to be 100% sure.`,
        };
      }
    }
    if (height && height < this.THRESHOLDS.HEIGHT.MIN) {
      return {
        isValid: false,
        errorMessage: `Is your height really ${height}cm? Please double-check that for me.`,
      };
    }
    return { isValid: true, errorMessage: '' };
  }

  /**
   * Check whether the user already has weight and height on record.
   *
   * Priority order:
   *  1. Current message extraction (extracted.weight_value / extracted.height_value)
   *  2. User row (user.weight / user.height) — fastest, set by buildProfilePatch
   *  3. Last 20 contentRequest contexts — legacy fallback for data saved before
   *     the weight/height columns existed on the users table
   */
  private async userHasVitals(
    userId: string,
    extracted: Record<string, unknown>,
    user?: { weight?: number | null; height?: number | null },
  ): Promise<{ hasWeight: boolean; hasHeight: boolean }> {
    // 1. Check current message first
    const currentWeight = extracted.weight_value as number | null;
    const currentHeight = extracted.height_value as number | null;

    // 2. Check the user row directly (fast path)
    const rowWeight = user?.weight ?? null;
    const rowHeight = user?.height ?? null;

    if ((currentWeight || rowWeight) && (currentHeight || rowHeight)) {
      return {
        hasWeight: true,
        hasHeight: true,
      };
    }

    // 3. Legacy fallback: scan past contentRequests for stored vitals
    //    (covers data saved before weight/height columns existed)
    const pastRequests = await this.prisma.contentRequest.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { context: true },
    });

    let storedWeight: number | null = null;
    let storedHeight: number | null = null;

    for (const req of pastRequests) {
      const ctx = (req.context as Record<string, unknown>) ?? {};
      if (!storedWeight && ctx.weight) storedWeight = ctx.weight as number;
      if (!storedHeight && ctx.height) storedHeight = ctx.height as number;
      if (storedWeight && storedHeight) break;
    }

    return {
      hasWeight: Boolean(currentWeight || rowWeight || storedWeight),
      hasHeight: Boolean(currentHeight || rowHeight || storedHeight),
    };
  }

  /**
   * Persist data extracted from the chat message to the User record.
   *
   * Fields synced:
   *   name          — if extracted and not already set
   *   dueDate       — derived from pregnancyWeek, or parsed directly
   *   babyBirthDate — parsed from natural language ("my baby was born on...")
   *   deliveryType  — "cesarean" or "vaginal" from keywords
   *   babyName      — if extracted
   *
   * Rules:
   *   - Never overwrite an existing value with null/undefined
   *   - babyBirthDate takes priority: if present, clear dueDate
   *   - All date parsing is validated before writing
   *   - Any field change is logged at INFO level for auditability
   */
  private async saveDataToPrisma(
    userId: string,
    data: Record<string, unknown>,
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User ${userId} not found. Skipping DB update.`);
        return;
      }

      const patch = this.buildProfilePatch(user, data);

      if (Object.keys(patch).length > 0) {
        await this.prisma.user.update({ where: { id: userId }, data: patch });
        this.logger.log(
          `Profile auto-synced for user ${userId}: ${JSON.stringify(Object.keys(patch))}`,
        );
      }
    } catch (err) {
      this.logger.error(`saveDataToPrisma error: ${(err as Error).message}`);
      // Non-fatal — don't rethrow; chatbot reply still returns
    }
  }

  /**
   * Build a Prisma update payload from extracted chat data.
   * Only includes fields that are present in extracted data AND
   * either missing from the user record or being upgraded to a more
   * specific value (e.g. pregnancyWeek → dueDate → babyBirthDate).
   */
  private buildProfilePatch(
    user: {
      name: string;
      dueDate: Date | null;
      babyBirthDate: Date | null;
      babyName: string | null;
      deliveryType: string | null;
      weight?: number | null;
      height?: number | null;
    },
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = {};

    // ── name ────────────────────────────────────────────────────────────────
    if (
      data.name &&
      typeof data.name === 'string' &&
      data.name.trim().length > 1 &&
      (!user.name ||
        user.name.toLowerCase().includes('guest') ||
        user.name.toLowerCase().includes('user'))
    ) {
      patch.name = data.name.trim();
    }

    // ── babyName ─────────────────────────────────────────────────────────────
    if (data.babyName && typeof data.babyName === 'string' && !user.babyName) {
      patch.babyName = data.babyName.trim();
    }

    // ── weight ───────────────────────────────────────────────────────────────
    // Write to user row so subsequent sessions don't re-ask.
    const extractedWeight = data.weight_value as number | null;
    if (extractedWeight && !user.weight) {
      if (
        extractedWeight >= this.THRESHOLDS.WEIGHT.MIN &&
        extractedWeight <= this.THRESHOLDS.WEIGHT.MAX
      ) {
        patch.weight = extractedWeight;
      }
    }

    // ── height ───────────────────────────────────────────────────────────────
    const extractedHeight = data.height_value as number | null;
    if (extractedHeight && !user.height) {
      if (
        extractedHeight >= this.THRESHOLDS.HEIGHT.MIN &&
        extractedHeight <= this.THRESHOLDS.HEIGHT.MAX
      ) {
        patch.height = extractedHeight;
      }
    }

    // ── babyBirthDate ────────────────────────────────────────────────────────
    // Highest priority — if baby is born, clear dueDate and set birth date.
    const rawBirthDate =
      (data.babyBirthDate as string | null) ??
      (data.baby_birth_date as string | null);

    if (rawBirthDate) {
      const parsed = this.parseSafeDate(rawBirthDate);
      if (parsed && this.isPlausibleBirthDate(parsed)) {
        if (
          !user.babyBirthDate ||
          Math.abs(parsed.getTime() - user.babyBirthDate.getTime()) >
            24 * 60 * 60 * 1000 // more than 1 day different — update
        ) {
          patch.babyBirthDate = parsed;
          patch.dueDate = null; // baby is born — due date is no longer relevant
        }
      }
    }

    // ── dueDate (from explicit date or derived from pregnancyWeek) ───────────
    // Only sync if babyBirthDate is not being set and baby is not already born.
    if (!patch.babyBirthDate && !user.babyBirthDate) {
      const rawDueDate =
        (data.dueDate as string | null) ?? (data.due_date as string | null);

      if (rawDueDate) {
        const parsed = this.parseSafeDate(rawDueDate);
        if (parsed && this.isPlausibleDueDate(parsed)) {
          if (
            !user.dueDate ||
            Math.abs(parsed.getTime() - user.dueDate.getTime()) >
              7 * 24 * 60 * 60 * 1000 // more than 1 week different — update
          ) {
            patch.dueDate = parsed;
          }
        }
      } else if (data.pregnancyWeek && !user.dueDate) {
        const weekStr =
          typeof data.pregnancyWeek === 'string' ||
          typeof data.pregnancyWeek === 'number'
            ? String(data.pregnancyWeek)
            : '';
        const week = parseInt(weekStr, 10);
        if (!isNaN(week) && week >= 4 && week <= 42) {
          const weeksRemaining = 40 - week;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + weeksRemaining * 7);
          patch.dueDate = dueDate;
        }
      }
    }

    // ── deliveryType ─────────────────────────────────────────────────────────
    // Parse from explicit field or natural language keywords in the raw message.
    if (!user.deliveryType) {
      const rawDelivery =
        (data.deliveryType as string | null) ??
        (data.delivery_type as string | null);

      if (rawDelivery) {
        const normalized = this.normalizeDeliveryType(rawDelivery);
        if (normalized) patch.deliveryType = normalized;
      }
    }

    return patch;
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  private parseSafeDate(value: unknown): Date | null {
    if (!value) return null;
    const str =
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
        ? String(value).trim()
        : '';
    if (!str || str === 'null' || str === 'undefined') return null;

    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  private isPlausibleBirthDate(d: Date): boolean {
    const now = new Date();
    const nineMonthsAgo = new Date(now);
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    // Birth date must be in the past and within the last 9 months
    return d <= now && d >= nineMonthsAgo;
  }

  private isPlausibleDueDate(d: Date): boolean {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const tenMonthsAhead = new Date(now);
    tenMonthsAhead.setMonth(tenMonthsAhead.getMonth() + 10);
    // Due date should be within 2 weeks past to 10 months ahead
    return d >= twoWeeksAgo && d <= tenMonthsAhead;
  }

  private normalizeDeliveryType(raw: string): 'cesarean' | 'vaginal' | null {
    const lower = raw.toLowerCase();
    if (
      lower.includes('cesarean') ||
      lower.includes('caesarean') ||
      lower.includes('c-section') ||
      lower.includes('csection') ||
      lower.includes('c section') ||
      lower.includes('surgical')
    ) {
      return 'cesarean';
    }
    if (
      lower.includes('vaginal') ||
      lower.includes('normal delivery') ||
      lower.includes('natural birth') ||
      lower.includes('natural delivery')
    ) {
      return 'vaginal';
    }
    return null;
  }

  /**
   * Proxy the ML service /health endpoint.
   * Called by GET /chatbot/health — no auth guard needed.
   */
  async checkMlHealth(): Promise<{
    mlStatus: 'ok' | 'degraded';
    chunksIndexed: number;
    mlUrl: string;
  }> {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.mlBaseUrl}/health`, { timeout: 4000 }),
      );
      const data = res.data as { status?: string; chunks_indexed?: number };
      return {
        mlStatus: data.status === 'ok' ? 'ok' : 'degraded',
        chunksIndexed: data.chunks_indexed ?? 0,
        mlUrl: this.mlBaseUrl,
      };
    } catch {
      return { mlStatus: 'degraded', chunksIndexed: 0, mlUrl: this.mlBaseUrl };
    }
  }

  private async getRAGResponse(
    message: string,
    extracted: Record<string, unknown>,
    user: { dueDate: Date | null },
    userId: string,
  ): Promise<RagResult | null> {
    const healthKeywords = [
      'eat',
      'food',
      'diet',
      'recipe',
      'pain',
      'feel',
      'symptom',
      'medicine',
      'exercise',
      'massage',
      'baby',
      'breastfeed',
      'sleep',
      'nausea',
      'vomit',
      'tired',
      'iron',
      'calcium',
      'ayurved',
      'herb',
      'when should',
      'how should',
      'what should',
      'is it safe',
      'can i',
      'should i',
    ];

    const isHealthQuestion = healthKeywords.some((kw) =>
      message.toLowerCase().includes(kw),
    );

    const emergencyKeywords = [
      'not breathing',
      'not moving',
      'unconscious',
      'emergency',
      'heavy bleeding',
      'baby not moving',
      "can't breathe",
    ];
    const isEmergency = emergencyKeywords.some((kw) =>
      message.toLowerCase().includes(kw),
    );

    if (!isHealthQuestion && !isEmergency) return null;

    try {
      let category = 'general';
      if (extracted.pregnancyWeek) category = 'maternal';
      else if (extracted.babyAgeMonths) category = 'pediatric';
      else if (
        ['food', 'eat', 'diet'].some((k) => message.toLowerCase().includes(k))
      ) {
        category = 'nutrition';
      }

      // Fetch last 4 messages from DB — passed to ML service so conversation
      // context survives server restarts instead of living in Python memory.
      const recentMessages = await this.prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { role: true, content: true },
      });
      // Reverse so oldest comes first (chronological order for the prompt)
      const conversationHistory = recentMessages
        .reverse()
        .map((m) => ({ role: m.role, content: m.content }));

      const ragResponse = await firstValueFrom(
        this.httpService.post(
          `${this.mlBaseUrl}/query`,
          {
            question: message,
            category,
            userId,
            nerContext: {
              pregnancyWeek: extracted.pregnancyWeek,
              babyAgeMonths: extracted.babyAgeMonths,
              conditions: extracted.conditions,
              weight: extracted.weight_value,
              height: extracted.height_value,
            },
            conversationHistory, // ← NEW: passed from DB, not Python memory
          },
          { timeout: 30000 },
        ),
      );

      const data = ragResponse.data as {
        answer: string;
        confidence: string;
        sources?: string[];
        bypass_rag?: boolean;
        queue_for_doctor?: boolean;
      };

      return {
        reply: data.answer,
        confidence: data.confidence ?? 'ai_generated',
        sources: data.sources ?? [],
        queueForDoctor:
          data.queue_for_doctor === true ||
          data.confidence === 'requires_doctor',
      };
    } catch (err) {
      this.logger.warn(`RAG service unavailable: ${(err as Error).message}`);
      return null;
    }
  }
}
