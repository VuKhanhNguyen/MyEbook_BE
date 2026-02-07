import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  // Regex: Allow letters (including Vietnamese), spaces. No numbers or special chars.
  @Matches(/^[a-zA-ZÀ-ỹ\s]+$/, {
    message: 'Full name must contain only letters and spaces',
  })
  fullName: string;
}
