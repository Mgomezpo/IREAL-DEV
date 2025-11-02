import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AttachIdeasDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ideaIds!: string[];
}
