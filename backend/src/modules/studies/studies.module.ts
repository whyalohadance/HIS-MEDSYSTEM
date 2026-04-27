import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Study } from './study.entity';
import { Modality } from './modality.entity';
import { Series } from './series.entity';
import { DicomImage } from './dicom-image.entity';
import { Measurement } from './measurement.entity';
import { Annotation } from './annotation.entity';
import { StudiesService } from './studies.service';
import { StudiesController } from './studies.controller';
import { DicomMetadataService } from './dicom-metadata.service';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Study, Modality, Series, DicomImage, Measurement, Annotation, Patient, User])],
  controllers: [StudiesController],
  providers: [StudiesService, DicomMetadataService],
  exports: [StudiesService, DicomMetadataService]
})
export class StudiesModule {}
