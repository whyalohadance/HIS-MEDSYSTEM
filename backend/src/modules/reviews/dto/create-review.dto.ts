import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
