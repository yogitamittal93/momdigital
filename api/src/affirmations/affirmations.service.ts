import { Injectable } from '@nestjs/common';

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
  generateCustomAffirmation(prompt: string) {
    const cleanedPrompt = prompt.trim().replace(/\s+/g, ' ');

    return {
      message:
        `When you say "${cleanedPrompt}", I want you to remember that you are doing enough, your body is healing, and your love matters every single day. Be gentle with yourself today and trust that this moment will pass.`,
      title: 'Personalized Affirmation',
      stage: 'postpartum',
    };
  }

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
    return {
      message: affirmation,
      stage,
      title: this.stageTitle(stage),
    };
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
