import { IsOptional, IsUUID } from 'class-validator';

export class PublishRequestDto {
  @IsUUID()
  calendarId!: string;

  @IsOptional()
  @IsUUID()
  runId?: string;
}
