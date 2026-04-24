export class CreateResultDto {
  parameterName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  minRange?: number;
  maxRange?: number;
  comment?: string;
}
