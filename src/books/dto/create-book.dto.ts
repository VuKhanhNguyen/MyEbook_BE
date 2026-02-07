import { IsOptional, IsString } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsOptional()
  title?: string;
}
