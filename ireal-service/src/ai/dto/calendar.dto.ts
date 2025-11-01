/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CalendarRequestDto {
  @IsString()
  planId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  frequency!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  channels!: string[];

  @IsArray()
  @IsString({ each: true })
  accounts!: string[];

  @IsOptional()
  @IsString()
  pillars?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  ideas?: string;
}
