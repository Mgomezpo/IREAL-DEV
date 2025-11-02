import { IsArray, IsUUID } from 'class-validator';

export class AttachPlansDto {
  @IsArray()
  @IsUUID('4', { each: true })
  planIds: string[] = [];
}
