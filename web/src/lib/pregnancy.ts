export function getPregnancyWeek(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  const conceptionDate = new Date(due);
  conceptionDate.setDate(conceptionDate.getDate() - 280);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor(
    (today.getTime() - conceptionDate.getTime()) / msPerWeek,
  );

  return Math.max(0, Math.min(42, weeksElapsed));
}

export function getTrimester(
  week: number,
): "first" | "second" | "third" {
  if (week <= 13) return "first";
  if (week <= 26) return "second";
  return "third";
}

export function getDaysUntilDue(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function formatTrimesterLabel(week: number): string {
  const t = getTrimester(week);
  if (t === "first") return "First Trimester";
  if (t === "second") return "Second Trimester";
  return "Third Trimester";
}

export interface BabySize {
  week: number;
  emoji: string;
  name: string;         // e.g. "Poppy seed"
  lengthCm: number;     // crown-rump length (early) / crown-heel (later)
  weightG: number;      // approximate weight in grams
  trimester: "first" | "second" | "third";
  funFact: string;
}

const BABY_SIZES: Omit<BabySize, "trimester">[] = [
  { week:  4, emoji: "🌱", name: "Poppy seed",      lengthCm: 0.1,  weightG: 0,    funFact: "The neural tube — future brain and spine — is forming." },
  { week:  5, emoji: "🫘", name: "Sesame seed",     lengthCm: 0.2,  weightG: 0,    funFact: "The heart begins beating this week." },
  { week:  6, emoji: "🫛", name: "Lentil",          lengthCm: 0.6,  weightG: 0,    funFact: "Tiny arm and leg buds are appearing." },
  { week:  7, emoji: "🫐", name: "Blueberry",       lengthCm: 1.0,  weightG: 0,    funFact: "The brain is growing at 100 cells per minute." },
  { week:  8, emoji: "🫒", name: "Kidney bean",     lengthCm: 1.6,  weightG: 1,    funFact: "All major organs have started forming." },
  { week:  9, emoji: "🍇", name: "Grape",           lengthCm: 2.3,  weightG: 2,    funFact: "Tiny fingers and toes are webbing." },
  { week: 10, emoji: "🍓", name: "Strawberry",      lengthCm: 3.1,  weightG: 4,    funFact: "Baby can now make small movements." },
  { week: 11, emoji: "🫚", name: "Fig",             lengthCm: 4.1,  weightG: 7,    funFact: "Baby is starting to hiccup — though you can't feel it yet." },
  { week: 12, emoji: "🍋", name: "Lime",            lengthCm: 5.4,  weightG: 14,   funFact: "Reflexes are developing — fingers will close if touched." },
  { week: 13, emoji: "🫛", name: "Pea pod",         lengthCm: 7.4,  weightG: 23,   funFact: "First trimester complete! Risk of miscarriage drops significantly." },
  { week: 14, emoji: "🍋", name: "Lemon",           lengthCm: 8.7,  weightG: 43,   funFact: "Baby can make facial expressions now." },
  { week: 15, emoji: "🍎", name: "Apple",           lengthCm: 10.1, weightG: 70,   funFact: "Bones are getting harder; baby can sense light." },
  { week: 16, emoji: "🥑", name: "Avocado",         lengthCm: 11.6, weightG: 100,  funFact: "You may feel first flutters of movement — called quickening." },
  { week: 17, emoji: "🍐", name: "Pear",            lengthCm: 13.0, weightG: 140,  funFact: "Baby's skeleton is changing from cartilage to bone." },
  { week: 18, emoji: "🫑", name: "Bell pepper",     lengthCm: 14.2, weightG: 190,  funFact: "Unique fingerprints are now forming." },
  { week: 19, emoji: "🥭", name: "Mango",           lengthCm: 15.3, weightG: 240,  funFact: "Vernix caseosa — a waxy coating — is forming on the skin." },
  { week: 20, emoji: "🍌", name: "Banana",          lengthCm: 16.5, weightG: 300,  funFact: "Halfway there! Baby can now hear your voice." },
  { week: 21, emoji: "🥕", name: "Carrot",          lengthCm: 26.7, weightG: 360,  funFact: "Baby is swallowing amniotic fluid, practising for feeding." },
  { week: 22, emoji: "🌽", name: "Corn",            lengthCm: 27.8, weightG: 430,  funFact: "Eyebrows and eyelids are fully formed." },
  { week: 23, emoji: "🍆", name: "Aubergine",       lengthCm: 28.9, weightG: 500,  funFact: "Baby's sense of movement is developed — she can feel you move." },
  { week: 24, emoji: "🌽", name: "Corn on the cob", lengthCm: 30.0, weightG: 600,  funFact: "Considered viable — survival outside the womb is possible." },
  { week: 25, emoji: "🥦", name: "Cauliflower",     lengthCm: 34.6, weightG: 660,  funFact: "Capillaries are forming, giving skin a pinkish tinge." },
  { week: 26, emoji: "🥬", name: "Kale bunch",      lengthCm: 35.6, weightG: 760,  funFact: "Eyes can now open and close; baby responds to light." },
  { week: 27, emoji: "🥦", name: "Broccoli",        lengthCm: 36.6, weightG: 875,  funFact: "Brain tissue is developing rapidly this week." },
  { week: 28, emoji: "🍆", name: "Large aubergine", lengthCm: 37.6, weightG: 1000, funFact: "Baby can blink, dream, and regulate body temperature." },
  { week: 29, emoji: "🥥", name: "Butternut squash",lengthCm: 38.6, weightG: 1150, funFact: "Muscles and lungs are maturing for life outside the womb." },
  { week: 30, emoji: "🥬", name: "Cabbage",         lengthCm: 39.9, weightG: 1320, funFact: "Baby's brain can now control breathing and body temperature." },
  { week: 31, emoji: "🥥", name: "Coconut",         lengthCm: 41.1, weightG: 1500, funFact: "All five senses are now working." },
  { week: 32, emoji: "🍈", name: "Jicama",          lengthCm: 42.4, weightG: 1700, funFact: "Baby is practising breathing 30–40 times per hour." },
  { week: 33, emoji: "🍍", name: "Pineapple",       lengthCm: 43.7, weightG: 1900, funFact: "Bones are hardening except for the skull, which stays soft for birth." },
  { week: 34, emoji: "🎃", name: "Cantaloupe",      lengthCm: 45.0, weightG: 2100, funFact: "Most babies are now head-down in preparation for birth." },
  { week: 35, emoji: "🍈", name: "Honeydew melon",  lengthCm: 46.2, weightG: 2400, funFact: "Kidneys are fully developed; liver processes waste." },
  { week: 36, emoji: "🥬", name: "Romaine lettuce", lengthCm: 47.4, weightG: 2600, funFact: "Baby is likely head-down and may drop lower into the pelvis." },
  { week: 37, emoji: "🫚", name: "Winter melon",    lengthCm: 48.6, weightG: 2900, funFact: "Considered early term — lungs and brain are still maturing." },
  { week: 38, emoji: "🎃", name: "Small pumpkin",   lengthCm: 49.8, weightG: 3100, funFact: "Baby's grip is strong enough to grasp your finger at birth." },
  { week: 39, emoji: "🍉", name: "Mini watermelon", lengthCm: 50.7, weightG: 3300, funFact: "Baby's brain will continue developing for years after birth." },
  { week: 40, emoji: "🎃", name: "Pumpkin",         lengthCm: 51.2, weightG: 3500, funFact: "Full term! Your baby is ready — see you soon." },
];

/**
 * Returns size, weight, emoji, and a fun fact for a given pregnancy week.
 * Falls back to the nearest known week for out-of-range values.
 */
export function getBabySize(week: number): BabySize {
  const clamped = Math.max(4, Math.min(40, Math.round(week)));
  const entry =
    BABY_SIZES.find((s) => s.week === clamped) ??
    BABY_SIZES.reduce((prev, curr) =>
      Math.abs(curr.week - clamped) < Math.abs(prev.week - clamped) ? curr : prev,
    );
  return { ...entry, trimester: getTrimester(entry.week) };
}

/**
 * Human-readable weight string, e.g. "300 g" or "1.7 kg"
 */
export function formatBabyWeight(weightG: number): string {
  if (weightG < 1000) return `${weightG} g`;
  return `${(weightG / 1000).toFixed(1)} kg`;
}

/**
 * How many days postpartum (for use in the dashboard postpartum mode)
 */
export function getDaysPostpartum(babyBirthDate: string | Date): number {
  const birth = new Date(babyBirthDate);
  birth.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)));
}