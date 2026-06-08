import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

const AFFIRMATIONS: Record<string, string[]> = {
  first_trimester: [
    'Your body is doing something remarkable. Trust the process.',
    'Every day, you are growing new life. That is extraordinary.',
    'Rest is not laziness — it is the work of creation.',
  ],
  second_trimester: [
    "You are halfway there. Look how far you've come.",
    'Your baby can hear your heartbeat. You are already their comfort.',
    'Nourishing yourself is nourishing your child.',
  ],
  third_trimester: [
    'Your body knows exactly what to do. You are ready.',
    'Each contraction brings you closer to meeting them.',
    'You have carried this life with strength and grace.',
  ],
  postpartum: [
    'You just did something extraordinary. Be gentle with yourself today.',
    'You are enough for your baby. Exactly as you are.',
    'Healing takes time. Every day you are getting stronger.',
  ],
};

@Injectable()
export class AffirmationsService {
  private readonly logger = new Logger(AffirmationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  getDailyAffirmation(user: {
    name?: string;
    dueDate?: Date | null;
    babyBirthDate?: Date | null;
  }) {
    const stage = this.getStage(user);
    const list = AFFIRMATIONS[stage] ?? AFFIRMATIONS.second_trimester;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    let affirmation = list[dayOfYear % list.length];
    if (user.name) {
      const first = user.name.split(' ')[0];
      affirmation = affirmation.replace(/^You/, first);
    }
    return { message: affirmation, stage, title: this.stageTitle(stage) };
  }

  /**
   * Generates a personalised affirmation via Groq.
   * Falls back to the static daily affirmation if Groq is unavailable.
   */
  async generatePersonalised(
    user: { name?: string; dueDate?: Date | null; babyBirthDate?: Date | null },
    opts: { mood?: string; intention?: string },
  ) {
    const stage = this.getStage(user);
    const firstName = user.name?.split(' ')[0] ?? 'dear one';

    const stageContext = {
      first_trimester: 'she is in her first trimester of pregnancy',
      second_trimester: 'she is in her second trimester of pregnancy',
      third_trimester: 'she is in her third trimester, getting close to birth',
      postpartum: 'she has recently given birth and is in the postpartum recovery phase',
    }[stage] ?? 'she is a mother';

    const prompt = [
      `Write one warm, personal affirmation for ${firstName}.`,
      `Context: ${stageContext}.`,
      opts.mood ? `Her current mood: ${opts.mood}.` : '',
      opts.intention ? `Her intention today: ${opts.intention}.` : '',
      `The affirmation should:`,
      `- Be 1-3 sentences, warm and personal`,
      `- Feel like it comes from a wise Indian elder sister`,
      `- Draw from Ayurvedic or Indian cultural wisdom where natural`,
      `- Address her by name (${firstName}) once`,
      `- Be encouraging but not generic`,
      `Return only the affirmation text, nothing else.`,
    ].filter(Boolean).join(' ');

    try {
      const apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.8,
          },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
        ),
      );

      const message = response.data?.choices?.[0]?.message?.content?.trim();
      if (message) {
        return { message, stage, title: this.stageTitle(stage), generated: true };
      }
    } catch (err) {
      this.logger.warn(`Groq affirmation generation failed: ${(err as Error).message}`);
    }

    // Fallback to static
    return { ...this.getDailyAffirmation(user), generated: false };
  }

  private getStage(user: {
    dueDate?: Date | null;
    babyBirthDate?: Date | null;
  }): string {
    if (user.babyBirthDate) return 'postpartum';
    if (user.dueDate) {
      const week = this.getPregnancyWeek(user.dueDate);
      if (week <= 13) return 'first_trimester';
      if (week <= 26) return 'second_trimester';
      return 'third_trimester';
    }
    return 'second_trimester';
  }

  private getPregnancyWeek(dueDate: Date): number {
    const due = new Date(dueDate);
    const conception = new Date(due);
    conception.setDate(conception.getDate() - 280);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.max(
      0,
      Math.min(42, Math.floor((Date.now() - conception.getTime()) / msPerWeek)),
    );
  }

  private stageTitle(stage: string): string {
    const titles: Record<string, string> = {
      first_trimester: 'First Trimester Strength',
      second_trimester: 'Growing Together',
      third_trimester: 'Almost There',
      postpartum: 'New Mother Grace',
    };
    return titles[stage] ?? 'Daily Affirmation';
  }
}
