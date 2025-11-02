import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderSectionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sectionIds!: string[];
}
