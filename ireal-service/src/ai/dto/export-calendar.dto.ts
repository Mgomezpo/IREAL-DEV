import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export class ExportCalendarDto {
  @IsUUID()
  calendarId!: string;

  @IsOptional()
  @IsUUID()
  runId?: string;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}
