import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Study } from './study.entity';
import { Modality } from './modality.entity';
import { Series } from './series.entity';
import { DicomImage } from './dicom-image.entity';
import { StudiesService } from './studies.service';
import { StudiesController } from './studies.controller';
import { DicomMetadataService } from './dicom-metadata.service';

@Module({
  imports: [TypeOrmModule.forFeature([Study, Modality, Series, DicomImage])],
  controllers: [StudiesController],
  providers: [StudiesService, DicomMetadataService],
  exports: [StudiesService, DicomMetadataService]
})
export class StudiesModule {}
