import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  doctorId: number;

  @IsNumber()
  roomId: number;

  @IsNumber()
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
