import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

const trimValue = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const stringified = String(value).trim();
    return stringified.length > 0 ? stringified : undefined;
  }

  return undefined;
};

export class GeneratePlanFormDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  nombre?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  pasion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  motivacion?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  conexion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
        .map((topic) => trimValue(topic))
        .filter((topic): topic is string => !!topic);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0);
    }

    return [];
  })
  temas?: string[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  vision?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  tiempo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contextNotes?: string[];
}
