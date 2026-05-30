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
          confidence: 'requires_doctor',
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

      const hasVitals = await this.userHasVitals(userId, extracted);

      const onboardingComplete =
        user.name &&
        !user.name.toLowerCase().includes('guest') &&
        (user.dueDate ||
          user.babyBirthDate ||
          extracted.pregnancyWeek ||
          extracted.babyAgeMonths) &&
        hasVitals;

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
  ): Promise<boolean> {
    if (extracted.weight_value && extracted.height_value) {
      return true;
    }

    const last = await this.prisma.contentRequest.findFirst({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
    });

    const ctx = (last?.context as Record<string, unknown>) ?? {};
    return Boolean(ctx.weight && ctx.height);
  }

  private async saveDataToPrisma(
    userId: string,
    data: Record<string, unknown>,
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found. Skipping DB update.`);
        return;
      }

      const updatePayload: Record<string, unknown> = {};

      if (data.name) updatePayload.name = data.name as string;

      if (user.role === 'MOTHER' && data.pregnancyWeek) {
        if (!user.babyBirthDate) {
          const weeksRemaining = 40 - parseInt(String(data.pregnancyWeek), 10);
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + weeksRemaining * 7);
          updatePayload.dueDate = dueDate;
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: updatePayload,
        });
      }

      await this.prisma.contentRequest.create({
        data: {
          requestType: 'GENERAL_QUESTION',
          uploadedById: userId,
          questionText: 'Onboarding Data Update',
          context: {
            weight: data.weight_value || null,
            height: data.height_value || null,
            conditions: data.conditions || [],
            rawExtraction: data,
          } as object,
          status: 'ML_REVIEWED',
        },
      });
    } catch (err) {
      this.logger.error(
        `Database error in saveDataToPrisma: ${(err as Error).message}`,
      );
      throw err;
    }
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
