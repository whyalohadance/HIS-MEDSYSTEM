import { IsString, Equals } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  @Equals('RESTORE', { message: 'Confirmation text must be exactly "RESTORE"' })
  confirmation: string;
}
