import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber()
  @IsNotEmpty()
  progress: number;

  @IsString()
  @IsNotEmpty()
  lastLocation: string;
}
