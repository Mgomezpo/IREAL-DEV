import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateIdeaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
