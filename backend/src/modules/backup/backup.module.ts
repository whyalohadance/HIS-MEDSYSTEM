import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ConfigModule, AuditModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
