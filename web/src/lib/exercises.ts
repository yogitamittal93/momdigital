// ─── Exercise library ─────────────────────────────────────────────────────────
//
// Exercises are gated by phase and, for postpartum, by weeks since birth and
// delivery type. This file is pure data — no API calls, no React.
//
// Usage:
//   const exercises = getExercises({ isPostpartum, weeksSinceBirth, deliveryType })

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: string;   // human label, e.g. "3 min"
  sets: string;       // human label, e.g. "10 reps"
  intensity: 'Very Light' | 'Light' | 'Moderate';
  category: 'breathing' | 'pelvic' | 'core' | 'mobility' | 'strength' | 'cardio';
  // Minimum weeks postpartum before unlocking. Cesarean gates are higher.
  minWeekVaginal?: number;
  minWeekCesarean?: number;
}

// ── Pregnancy exercises ───────────────────────────────────────────────────────
export const PREGNANCY_EXERCISES: Exercise[] = [
  {
    id: 'prenatal-breathing',
    name: 'Deep Belly Breathing',
    description: 'Diaphragmatic breathing to reduce anxiety and improve oxygen flow.',
    duration: '3 min', sets: '5 slow breaths', intensity: 'Very Light', category: 'breathing',
  },
  {
    id: 'prenatal-pelvic-floor',
    name: 'Kegel Exercises',
    description: 'Strengthen pelvic floor muscles to prepare for birth and reduce leakage.',
    duration: '5 min', sets: '10 pulses × 3', intensity: 'Very Light', category: 'pelvic',
  },
  {
    id: 'prenatal-cat-cow',
    name: 'Cat-Cow Stretch',
    description: 'Relieve lower back tension and improve spinal mobility.',
    duration: '4 min', sets: '10 cycles', intensity: 'Very Light', category: 'mobility',
  },
  {
    id: 'prenatal-ankle-circles',
    name: 'Ankle Circles',
    description: 'Improve circulation and reduce swelling in the feet and ankles.',
    duration: '2 min', sets: '10 each direction', intensity: 'Very Light', category: 'mobility',
  },
  {
    id: 'prenatal-side-lying',
    name: 'Side-Lying Hip Abduction',
    description: 'Strengthen glutes and outer hips to reduce pelvic girdle pain.',
    duration: '5 min', sets: '12 each side', intensity: 'Light', category: 'strength',
  },
  {
    id: 'prenatal-walk',
    name: '15-Minute Prenatal Walk',
    description: 'Gentle cardio that boosts mood and keeps circulation healthy.',
    duration: '15 min', sets: '1 session', intensity: 'Light', category: 'cardio',
  },
];

// ── Postpartum exercises — gated by weeks since birth ────────────────────────
export const POSTPARTUM_EXERCISES: Exercise[] = [
  // Week 0–2 (all deliveries)
  {
    id: 'pp-belly-breathing',
    name: 'Deep Belly Breathing',
    description: 'Reconnect with your diaphragm and begin gentle core activation.',
    duration: '2 min', sets: '5 breaths × 3', intensity: 'Very Light', category: 'breathing',
    minWeekVaginal: 0, minWeekCesarean: 0,
  },
  {
    id: 'pp-ankle-pumps',
    name: 'Ankle Pumps',
    description: 'Prevent blood clots and restore circulation to the lower legs.',
    duration: '2 min', sets: '20 pumps', intensity: 'Very Light', category: 'mobility',
    minWeekVaginal: 0, minWeekCesarean: 0,
  },
  {
    id: 'pp-pelvic-floor-gentle',
    name: 'Gentle Pelvic Floor Activation',
    description: 'Very light awareness exercise — do not force or hold.',
    duration: '3 min', sets: '5 gentle pulses', intensity: 'Very Light', category: 'pelvic',
    minWeekVaginal: 0, minWeekCesarean: 0,
  },
  // Week 1–3 vaginal / Week 3–4 cesarean
  {
    id: 'pp-short-walk',
    name: '5-Minute Gentle Walk',
    description: 'Begin rebuilding stamina. Stop if you feel pressure or pain.',
    duration: '5 min', sets: '1 session', intensity: 'Very Light', category: 'cardio',
    minWeekVaginal: 1, minWeekCesarean: 3,
  },
  {
    id: 'pp-pelvic-tilts',
    name: 'Pelvic Tilts',
    description: 'Gently re-engage the transverse abdominis without straining the incision.',
    duration: '5 min', sets: '10 reps', intensity: 'Very Light', category: 'core',
    minWeekVaginal: 1, minWeekCesarean: 4,
  },
  // Week 3+ vaginal / Week 6+ cesarean
  {
    id: 'pp-bridge',
    name: 'Glute Bridges',
    description: 'Activate glutes and gently load the pelvic floor.',
    duration: '5 min', sets: '10 reps × 2', intensity: 'Light', category: 'strength',
    minWeekVaginal: 3, minWeekCesarean: 6,
  },
  {
    id: 'pp-walk-15',
    name: '15-Minute Walk',
    description: 'Build cardiovascular fitness at a comfortable pace.',
    duration: '15 min', sets: '1 session', intensity: 'Light', category: 'cardio',
    minWeekVaginal: 3, minWeekCesarean: 6,
  },
  // Week 6+ vaginal / Week 8+ cesarean
  {
    id: 'pp-clamshells',
    name: 'Clamshells',
    description: 'Strengthen hip abductors and reduce lower back pain.',
    duration: '6 min', sets: '15 each side', intensity: 'Light', category: 'strength',
    minWeekVaginal: 6, minWeekCesarean: 8,
  },
  {
    id: 'pp-dead-bug',
    name: 'Dead Bug',
    description: 'Core stability without spinal loading — safe for diastasis recti.',
    duration: '6 min', sets: '8 reps × 3', intensity: 'Moderate', category: 'core',
    minWeekVaginal: 6, minWeekCesarean: 8,
  },
];

// ── Public selector ───────────────────────────────────────────────────────────

export interface ExerciseFilter {
  isPostpartum: boolean;
  weeksSinceBirth?: number;
  deliveryType?: string | null; // "vaginal" | "cesarean" | null
}

export function getExercises({
  isPostpartum,
  weeksSinceBirth = 0,
  deliveryType,
}: ExerciseFilter): Exercise[] {
  if (!isPostpartum) return PREGNANCY_EXERCISES;

  const isCesarean = deliveryType === 'cesarean';

  return POSTPARTUM_EXERCISES.filter((ex) => {
    const minWeek = isCesarean
      ? (ex.minWeekCesarean ?? 0)
      : (ex.minWeekVaginal ?? 0);
    return weeksSinceBirth >= minWeek;
  });
}

/** How many weeks have elapsed since the baby was born. */
export function getWeeksSinceBirth(babyBirthDate: string | Date): number {
  const birth = new Date(babyBirthDate);
  const today = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((today.getTime() - birth.getTime()) / msPerWeek));
}
