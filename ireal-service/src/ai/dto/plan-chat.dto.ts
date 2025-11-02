import {
  ArrayNotEmpty,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export const PLAN_CHAT_ROLES = ['user', 'assistant', 'system'] as const;

export type PlanChatRole = (typeof PLAN_CHAT_ROLES)[number];

export class MessageDto {
  @IsString()
  @IsIn(PLAN_CHAT_ROLES)
  role!: PlanChatRole;

  @IsString()
  content!: string;
}

export class PlanContextDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}

export class PlanChatDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages!: MessageDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanContextDto)
  planContext?: PlanContextDto;
}
