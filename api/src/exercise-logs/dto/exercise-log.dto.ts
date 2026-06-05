import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateExerciseLogDto {
  @IsString()
  exerciseId: string; // e.g. "deep-belly-breathing", "pelvic-floor-activation"

  @IsIn(['pregnancy', 'postpartum'])
  phase: 'pregnancy' | 'postpartum';

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMins?: number;
}
