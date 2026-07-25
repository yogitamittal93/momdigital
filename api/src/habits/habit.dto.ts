import { BadRequestException } from '@nestjs/common';

/**
 * Plain interfaces (not classes) so Nest's global ValidationPipe does not
 * whitelist/forbid-non-whitelisted against an empty decorator metadata set.
 * That misconfiguration was returning 400 "property name should not exist"
 * in production even after class-validator decorators were added.
 *
 * Validation is explicit below — deterministic, no reflect-metadata dependency.
 */

export interface CreateHabitDto {
  name: string;
  emoji?: string;
  category?: string;
  color?: string;
  targetQuantity?: number;
  unit?: string;
  sortOrder?: number;
  hasLoadingPhase?: boolean;
  loadingPhaseDays?: number;
  loadingStartDate?: string;
}

export interface LogHabitDto {
  date: string;
  quantity?: number;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  return value;
}

function asOptionalInt(value: unknown, field: string, min: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min) {
    throw new BadRequestException(`${field} must be an integer >= ${min}`);
  }
  return n;
}

function asOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${field} must be a boolean`);
  }
  return value;
}

export function parseCreateHabitBody(body: unknown): CreateHabitDto {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid habit payload');
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) {
    throw new BadRequestException('name is required');
  }

  const hasLoadingPhase = asOptionalBoolean(b.hasLoadingPhase, 'hasLoadingPhase');
  const loadingStartDate = asOptionalString(b.loadingStartDate, 'loadingStartDate');
  if (loadingStartDate && Number.isNaN(Date.parse(loadingStartDate))) {
    throw new BadRequestException('loadingStartDate must be a valid ISO date');
  }

  return {
    name: b.name.trim(),
    emoji: asOptionalString(b.emoji, 'emoji'),
    category: asOptionalString(b.category, 'category'),
    color: asOptionalString(b.color, 'color'),
    targetQuantity: asOptionalInt(b.targetQuantity, 'targetQuantity', 1),
    unit: asOptionalString(b.unit, 'unit'),
    sortOrder: asOptionalInt(b.sortOrder, 'sortOrder', 0),
    hasLoadingPhase,
    loadingPhaseDays: asOptionalInt(b.loadingPhaseDays, 'loadingPhaseDays', 1),
    loadingStartDate,
  };
}

export function parseLogHabitBody(body: unknown): LogHabitDto {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid habit log payload');
  }
  const b = body as Record<string, unknown>;

  if (typeof b.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }

  return {
    date: b.date,
    quantity: asOptionalInt(b.quantity, 'quantity', 1),
  };
}

export function parseUpdateHabitBody(body: unknown): Partial<CreateHabitDto> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid habit payload');
  }
  const b = body as Record<string, unknown>;
  const out: Partial<CreateHabitDto> = {};

  if ('name' in b) {
    if (typeof b.name !== 'string' || !b.name.trim()) {
      throw new BadRequestException('name must be a non-empty string');
    }
    out.name = b.name.trim();
  }
  if ('emoji' in b) out.emoji = asOptionalString(b.emoji, 'emoji');
  if ('category' in b) out.category = asOptionalString(b.category, 'category');
  if ('color' in b) out.color = asOptionalString(b.color, 'color');
  if ('targetQuantity' in b) {
    out.targetQuantity = asOptionalInt(b.targetQuantity, 'targetQuantity', 1);
  }
  if ('unit' in b) out.unit = asOptionalString(b.unit, 'unit');
  if ('sortOrder' in b) out.sortOrder = asOptionalInt(b.sortOrder, 'sortOrder', 0);
  if ('hasLoadingPhase' in b) {
    out.hasLoadingPhase = asOptionalBoolean(b.hasLoadingPhase, 'hasLoadingPhase');
  }
  if ('loadingPhaseDays' in b) {
    out.loadingPhaseDays = asOptionalInt(b.loadingPhaseDays, 'loadingPhaseDays', 1);
  }
  if ('loadingStartDate' in b) {
    const loadingStartDate = asOptionalString(b.loadingStartDate, 'loadingStartDate');
    if (loadingStartDate && Number.isNaN(Date.parse(loadingStartDate))) {
      throw new BadRequestException('loadingStartDate must be a valid ISO date');
    }
    out.loadingStartDate = loadingStartDate;
  }

  return out;
}
