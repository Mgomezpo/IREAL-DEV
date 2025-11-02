import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const GENERATE_AI_TYPES = [
  'general',
  'calendar',
  'idea',
  'plan',
] as const;

export type GenerateAiType = (typeof GENERATE_AI_TYPES)[number];

export class GenerateAiDto {
  @IsString()
  @MaxLength(4000)
  prompt!: string;

  @IsOptional()
  @IsIn(GENERATE_AI_TYPES)
  type?: GenerateAiType;
}
