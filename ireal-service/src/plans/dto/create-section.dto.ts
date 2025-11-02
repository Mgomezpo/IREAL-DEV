import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  sectionType?: string | null;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown> | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
