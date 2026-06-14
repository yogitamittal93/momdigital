import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentRequestType, UserRole } from '@prisma/client';

/**
 * Routes a ContentRequest to the appropriate expert roles.
 *
 * Resolution order:
 *  1. ML webhook (if ML_WEBHOOK_URL is set in env).
 *     POST { requestType, context } → { roles: UserRole[], answer?: string, confidence?: number }
 *  2. Rule-based fallback (always available).
 */
@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private readonly configService: ConfigService) {}

  async route(
    requestType: ContentRequestType,
    context?: Record<string, unknown>,
  ): Promise<{
    roles: UserRole[];
    mlResponse?: string;
    mlConfidence?: number;
  }> {
    const mlWebhookUrl = this.configService.get<string>('ML_WEBHOOK_URL');

    if (mlWebhookUrl) {
      try {
        const result = await this.callMlWebhook(
          mlWebhookUrl,
          requestType,
          context,
        );
        this.logger.log(
          `ML routed ${requestType} → ${result.roles.join(', ')}`,
        );
        return result;
      } catch (err) {
        this.logger.warn(`ML webhook failed, falling back to rules: ${err}`);
      }
    }

    return { roles: this.ruleBasedRoute(requestType) };
  }

  // ─── Rule-based routing ────────────────────────────────────────────────────

  private ruleBasedRoute(type: ContentRequestType): UserRole[] {
    switch (type) {
      case ContentRequestType.MEDICAL_SCAN:
        return [UserRole.MBBS, UserRole.AYURVEDA];

      case ContentRequestType.DIETARY_QUERY:
      case ContentRequestType.RECIPE_REVIEW:
        return [UserRole.NUTRITIONIST, UserRole.CHEF];

      case ContentRequestType.EXERCISE_QUERY:
        return [UserRole.YOGA_TRAINER, UserRole.WORKOUT_TRAINER];

      case ContentRequestType.CROSS_DISCIPLINE:
        // e.g. "Can I take Omega-3 at 6 months?" — both medical + nutrition
        return [UserRole.MBBS, UserRole.NUTRITIONIST];

      case ContentRequestType.GENERAL_QUESTION:
      default:
        // Broadest net — ML will narrow this in future
        return [UserRole.MBBS, UserRole.NUTRITIONIST];
    }
  }

  // ─── ML Webhook stub ───────────────────────────────────────────────────────

  private async callMlWebhook(
    url: string,
    requestType: ContentRequestType,
    context?: Record<string, unknown>,
  ): Promise<{
    roles: UserRole[];
    mlResponse?: string;
    mlConfidence?: number;
  }> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType, context }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`ML webhook returned ${response.status}`);
    }

    const data = (await response.json()) as {
      roles: string[];
      answer?: string;
      confidence?: number;
    };

    return {
      roles: data.roles as UserRole[],
      mlResponse: data.answer,
      mlConfidence: data.confidence,
    };
  }
}
