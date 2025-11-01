/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export const PLAN_ASSIST_ROLES = ['user', 'assistant'] as const;

export type PlanAssistRole = (typeof PLAN_ASSIST_ROLES)[number];

export class PlanAssistMessageDto {
  @IsString()
  @IsIn(PLAN_ASSIST_ROLES)
  role!: PlanAssistRole;

  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class PlanAssistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanAssistMessageDto)
  messages!: PlanAssistMessageDto[];

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  command?: string;
}
