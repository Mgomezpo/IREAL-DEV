import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum CalendarCadence {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class CalendarRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  channels!: string[];

  @IsEnum(CalendarCadence)
  cadence!: CalendarCadence;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsOptional()
  @IsObject()
  constraints?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  calendarId?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  /**
   * Legacy properties kept optional so older clients remain compatible.
   * They are normalized by the service into the new schema.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accounts?: string[];

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  ideas?: string;

  @IsOptional()
  @IsString()
  pillars?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  frequency?: number;
}

export class CalendarEntryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsString()
  channel!: string;

  @IsString()
  format!: string;

  @IsString()
  copy!: string;

  @IsString()
  script!: string;

  @IsString()
  targetAudience!: string;

  @IsString()
  date!: string;

  @IsString()
  time!: string;

  @IsArray()
  @IsString({ each: true })
  hashtags!: string[];
}

export class SaveCalendarEntriesDto {
  @IsUUID()
  calendarId!: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsArray()
  entries!: CalendarEntryDto[];
}
