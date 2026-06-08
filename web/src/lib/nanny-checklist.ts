// Mirror of api/src/nanny/nanny-checklist.constants.ts
// Pure data — no NestJS imports. Keep in sync if the API version changes.

export type ChecklistItem = {
  id: string;
  label: string;
  critical: boolean;
  days_applicable?: number[];
};

export const NANNY_CHECKLIST_PROTOCOL = {
  daily_first_15_days: [
    { id: 'handwash_before_baby',  label: 'Washed hands before touching baby',            critical: true  },
    { id: 'handwash_after_nappy',  label: 'Washed hands after nappy change',              critical: true  },
    { id: 'langot_correct',        label: 'Langot/nappy tied correctly (not too tight)',   critical: true  },
    { id: 'navel_cleaned',         label: 'Navel cord cleaned with spirit swab',          critical: true,
      days_applicable: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
    { id: 'baby_position_varied',  label: 'Baby position changed every 2 hours',          critical: false },
    { id: 'milk_feeds_logged',     label: 'Milk feeds logged (time + duration)',           critical: true  },
    { id: 'wet_nappies_counted',   label: 'Wet nappies counted (minimum 6/day)',           critical: true  },
    { id: 'baby_bath_clean',       label: 'Baby bathed/sponged with clean water',         critical: false },
    { id: 'mother_rest_supported', label: 'Mother given rest time',                       critical: false },
  ] as ChecklistItem[],

  daily_day_16_to_30: [
    { id: 'handwash_before_baby', label: 'Washed hands before touching baby',  critical: true  },
    { id: 'langot_correct',       label: 'Nappy/diaper fitted correctly',       critical: true  },
    { id: 'milk_feeds_logged',    label: 'Feeds logged',                        critical: true  },
    { id: 'baby_tummy_time',      label: 'Tummy time given (5 min minimum)',    critical: false },
    { id: 'baby_bath_clean',      label: 'Baby bathed',                         critical: false },
  ] as ChecklistItem[],

  weekly_after_day_30: [
    { id: 'weight_check',            label: 'Baby weight checked',                   critical: false },
    { id: 'developmental_milestone', label: 'Milestone observation logged',           critical: false },
    { id: 'vaccination_due',         label: 'Upcoming vaccination checked',           critical: true  },
  ] as ChecklistItem[],
};

export const TRUST_MILESTONES = [
  { day: 5,  label: 'First week review',  message: 'Review first 5 days. Is the nanny following all critical checks?' },
  { day: 15, label: 'Two week review',    message: 'Navel should be healed. Reduce daily checks on cord care.' },
  { day: 30, label: 'One month review',   message: 'After consistent checks, you can start weekly monitoring for non-critical items.' },
  { day: 60, label: 'Two month review',   message: 'Trust established for daily care. Focus weekly checks on development and feeding.' },
];

export function getChecklistItemsForDay(dayNumber: number): ChecklistItem[] {
  if (dayNumber <= 15) {
    return NANNY_CHECKLIST_PROTOCOL.daily_first_15_days.filter(
      (item) => !item.days_applicable || item.days_applicable.includes(dayNumber),
    );
  }
  if (dayNumber <= 30) return NANNY_CHECKLIST_PROTOCOL.daily_day_16_to_30;
  if (dayNumber % 7 === 0) return NANNY_CHECKLIST_PROTOCOL.weekly_after_day_30;
  return NANNY_CHECKLIST_PROTOCOL.daily_day_16_to_30;
}

export function getDayNumber(babyBirthDate: string | Date): number {
  const birth = new Date(babyBirthDate);
  birth.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}
