import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsEnum(['male', 'female'])
  gender: 'male' | 'female';

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  doctorId?: number;
}
