import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examination } from './examination.entity';
import { ExaminationsService } from './examinations.service';
import { ExaminationsController } from './examinations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Examination])],
  providers: [ExaminationsService],
  controllers: [ExaminationsController],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
