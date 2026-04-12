import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Study } from './study.entity';
import { Modality } from './modality.entity';
import { StudiesService } from './studies.service';
import { StudiesController } from './studies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Study, Modality])],
  controllers: [StudiesController],
  providers: [StudiesService],
  exports: [StudiesService]
})
export class StudiesModule {}
