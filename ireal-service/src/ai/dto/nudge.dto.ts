import { IsOptional, IsString, MaxLength } from 'class-validator';

export class NudgeDto {
  @IsString()
  @MaxLength(2000)
  fragment!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
