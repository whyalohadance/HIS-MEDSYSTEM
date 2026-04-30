import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { RoomType } from '../room.entity';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsNumber()
  @IsOptional()
  assignedUserId?: number;

  @IsArray()
  @IsOptional()
  services?: { name: string; price: number; duration: number }[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
