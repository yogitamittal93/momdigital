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
            { timeout: 5000 },
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
          confidence: 'auto_safe',   // NOT requires_doctor — this is a clarification, not an emergency
          sources: [],
        };
      }

      await this.saveDataToPrisma(userId, extracted);

      let user: {
        id: string;
        name: string;
        dueDate: Date | null;
        babyBirthDate: Date | null;
        weight?: number | null;
        height?: number | null;
      } | null = null;

      try {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
      } catch (err) {
        this.logger.warn(`Prisma error fetching user: ${(err as Error).message}`);
      }

      if (!user) throw new NotFoundException('User not found');

      const vitals = await this.userHasVitals(userId, extracted);

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
        const ragResult = await this.getRAGResponse(message, extracted, user);
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
      this.logger.warn(
        `Doctor queue failed: ${(err as Error).message}`,
      );
    }
  }

  private generateSmartReply(
    user: { name: string; dueDate: Date | null; babyBirthDate: Date | null; weight?: number | null; height?: number | null },
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

  private async userHasVitals(
    userId: string,
    extracted: Record<string, unknown>,
  ): Promise<{ hasWeight: boolean; hasHeight: boolean }> {
    // Check current message first
    const currentWeight = extracted.weight_value as number | null;
    const currentHeight = extracted.height_value as number | null;

    // Scan ALL past contentRequests for stored weight and height separately
    // This handles the case where weight was given in turn 1 and height in turn 2
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
      hasWeight: Boolean(currentWeight || storedWeight),
      hasHeight: Boolean(currentHeight || storedHeight),
    };
  }

  /**
   * Persist extracted chat data to the authenticated user profile.
   *
   * Fields synced:
   *   name          — if extracted and not already set
   *   dueDate       — derived from pregnancyWeek, or parsed directly
   *   babyBirthDate — parsed from natural language
   *   deliveryType  — inferred from keywords
   *   babyName      — if extracted
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
        await this.prisma.user.update({
          where: { id: userId },
          data: patch,
        });
        this.logger.log(
          `Profile auto-synced for user ${userId}: ${JSON.stringify(Object.keys(patch))}`,
        );
      }

      await this.prisma.contentRequest.create({
        data: {
          requestType: 'GENERAL_QUESTION',
          uploadedById: userId,
          questionText: 'Onboarding Data Update',
          context: {
            weight: data.weight_value ?? null,
            height: data.height_value ?? null,
            conditions: data.conditions ?? [],
            rawExtraction: data,
          } as object,
          status: 'ML_REVIEWED',
        },
      });
    } catch (err) {
      this.logger.error(
        `saveDataToPrisma error: ${(err as Error).message}`,
      );
      // Non-fatal: the chatbot reply should still be returned.
    }
  }

  private buildProfilePatch(
    user: {
      name: string;
      dueDate: Date | null;
      babyBirthDate: Date | null;
      babyName: string | null;
      deliveryType: string | null;
    },
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = {};

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

    if (
      data.babyName &&
      typeof data.babyName === 'string' &&
      !user.babyName
    ) {
      patch.babyName = data.babyName.trim();
    }

    const rawBirthDate =
      (data.babyBirthDate as string | null) ??
      (data.baby_birth_date as string | null);

    if (rawBirthDate) {
      const parsed = this.parseSafeDate(rawBirthDate);
      if (parsed && this.isPlausibleBirthDate(parsed)) {
        patch.babyBirthDate = parsed;
        patch.dueDate = null;
      }
    }

    if (!patch.babyBirthDate && !user.babyBirthDate) {
      const rawDueDate =
        (data.dueDate as string | null) ??
        (data.due_date as string | null);

      if (rawDueDate) {
        const parsed = this.parseSafeDate(rawDueDate);
        if (parsed && this.isPlausibleDueDate(parsed)) {
          patch.dueDate = parsed;
        }
      } else if (data.pregnancyWeek && !user.dueDate) {
        const week = parseInt(String(data.pregnancyWeek), 10);
        if (!Number.isNaN(week) && week >= 4 && week <= 40) {
          const weeksRemaining = 40 - week;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + weeksRemaining * 7);
          patch.dueDate = dueDate;
        }
      }
    }

    if (!user.deliveryType) {
      const rawDelivery =
        (data.deliveryType as string | null) ??
        (data.delivery_type as string | null);

      const normalized = this.normalizeDeliveryType(rawDelivery ?? '');
      if (normalized) patch.deliveryType = normalized;
    }

    return patch;
  }

  private parseSafeDate(value: unknown): Date | null {
    if (!value) return null;

    const text = String(value).trim();
    if (!text || text === 'null' || text === 'undefined') return null;

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private isPlausibleBirthDate(date: Date): boolean {
    const now = new Date();
    const nineMonthsAgo = new Date(now);
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

    return date >= nineMonthsAgo && date <= now;
  }

  private isPlausibleDueDate(date: Date): boolean {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const tenMonthsAhead = new Date(now);
    tenMonthsAhead.setMonth(tenMonthsAhead.getMonth() + 10);

    return date >= twoWeeksAgo && date <= tenMonthsAhead;
  }

  private normalizeDeliveryType(raw: string): 'cesarean' | 'vaginal' | null {
    const lower = raw.toLowerCase();

    if (
      lower.includes('cesarean') ||
      lower.includes('caesarean') ||
      lower.includes('c-section') ||
      lower.includes('csection') ||
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

  private async getRAGResponse(
    message: string,
    extracted: Record<string, unknown>,
    user: { dueDate: Date | null },
  ): Promise<RagResult | null> {
    const healthKeywords = [
      'eat', 'food', 'diet', 'recipe', 'pain', 'feel', 'symptom',
      'medicine', 'exercise', 'massage', 'baby', 'breastfeed',
      'sleep', 'nausea', 'vomit', 'tired', 'iron', 'calcium',
      'ayurved', 'herb', 'when should', 'how should', 'what should',
      'is it safe', 'can i', 'should i',
    ];

    const isHealthQuestion = healthKeywords.some((kw) =>
      message.toLowerCase().includes(kw),
    );

    const emergencyKeywords = [
      'not breathing', 'not moving', 'unconscious', 'emergency',
      'heavy bleeding', 'baby not moving', 'can\'t breathe',
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

      const ragResponse = await firstValueFrom(
        this.httpService.post(
          `${this.mlBaseUrl}/query`,
          {
            question: message,
            category,
            nerContext: {
              pregnancyWeek: extracted.pregnancyWeek,
              babyAgeMonths: extracted.babyAgeMonths,
              conditions: extracted.conditions,
              weight: extracted.weight_value,
              height: extracted.height_value,
            },
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
