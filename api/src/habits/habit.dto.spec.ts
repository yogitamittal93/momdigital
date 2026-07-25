import {
  parseCreateHabitBody,
  parseLogHabitBody,
} from './habit.dto';

describe('habit.dto parsers', () => {
  it('accepts a custom habit payload', () => {
    const dto = parseCreateHabitBody({
      name: 'Creatine',
      emoji: '⭐',
      category: 'custom',
      hasLoadingPhase: true,
      loadingPhaseDays: 7,
      loadingStartDate: '2026-07-25T00:00:00.000Z',
      sortOrder: 0,
    });
    expect(dto.name).toBe('Creatine');
    expect(dto.hasLoadingPhase).toBe(true);
    expect(dto.loadingPhaseDays).toBe(7);
  });

  it('accepts a suggested habit payload', () => {
    const dto = parseCreateHabitBody({
      name: 'Water',
      emoji: '💧',
      category: 'hydration',
      color: '#38bdf8',
      unit: 'glasses',
      targetQuantity: 8,
      sortOrder: 1,
    });
    expect(dto.targetQuantity).toBe(8);
    expect(dto.color).toBe('#38bdf8');
  });

  it('rejects missing name', () => {
    expect(() => parseCreateHabitBody({ emoji: '⭐' })).toThrow(/name/i);
  });

  it('accepts a log payload', () => {
    expect(parseLogHabitBody({ date: '2026-07-25' })).toEqual({
      date: '2026-07-25',
      quantity: undefined,
    });
  });

  it('rejects bad log dates', () => {
    expect(() => parseLogHabitBody({ date: '25-07-2026' })).toThrow(/YYYY-MM-DD/);
  });
});
