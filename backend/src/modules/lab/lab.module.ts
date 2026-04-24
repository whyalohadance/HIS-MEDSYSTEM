import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabTest } from './lab-test.entity';
import { LabOrder } from './lab-order.entity';
import { LabResult } from './lab-result.entity';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LabTest, LabOrder, LabResult])],
  controllers: [LabController],
  providers: [LabService],
  exports: [LabService]
})
export class LabModule {}
