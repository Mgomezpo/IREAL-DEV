import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIdeaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
