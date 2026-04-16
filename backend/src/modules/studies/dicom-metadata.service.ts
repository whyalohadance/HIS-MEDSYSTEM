import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class DicomMetadataService {

  extractMetadataFromFile(filePath: string): any {
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);

    return {
      // Patient level
      patientName:       this.extractTag(buffer, '00100010'),
      patientId:         this.extractTag(buffer, '00100020'),
      patientBirthDate:  this.extractTag(buffer, '00100030'),
      patientSex:        this.extractTag(buffer, '00100040'),
      patientAge:        this.extractTag(buffer, '00101010'),
      patientWeight:     this.extractTag(buffer, '00101030'),

      // Study level
      studyInstanceUID:    this.extractTag(buffer, '0020000D'),
      studyDate:           this.extractTag(buffer, '00080020'),
      studyTime:           this.extractTag(buffer, '00080030'),
      studyDescription:    this.extractTag(buffer, '00081030'),
      accessionNumber:     this.extractTag(buffer, '00080050'),
      referringPhysician:  this.extractTag(buffer, '00080090'),

      // Series level
      seriesInstanceUID:  this.extractTag(buffer, '0020000E'),
      seriesNumber:       this.extractTag(buffer, '00200011'),
      seriesDescription:  this.extractTag(buffer, '0008103E'),
      modality:           this.extractTag(buffer, '00080060'),
      bodyPart:           this.extractTag(buffer, '00180015'),
      seriesDate:         this.extractTag(buffer, '00080021'),
      seriesTime:         this.extractTag(buffer, '00080031'),

      // Image level
      sopInstanceUID:    this.extractTag(buffer, '00080018'),
      instanceNumber:    this.extractTag(buffer, '00200013'),
      rows:              this.extractTag(buffer, '00280010'),
      columns:           this.extractTag(buffer, '00280011'),
      bitsAllocated:     this.extractTag(buffer, '00280100'),
      windowCenter:      this.extractTag(buffer, '00281050'),
      windowWidth:       this.extractTag(buffer, '00281051'),
      sliceLocation:     this.extractTag(buffer, '00201041'),
      sliceThickness:    this.extractTag(buffer, '00500010'),
      pixelSpacing:      this.extractTag(buffer, '00280030'),
      numberOfFrames:    this.extractTag(buffer, '00280008'),

      // Equipment
      manufacturer:      this.extractTag(buffer, '00080070'),
      manufacturerModel: this.extractTag(buffer, '00081090'),
      stationName:       this.extractTag(buffer, '00081010'),
      institutionName:   this.extractTag(buffer, '00080080'),
      kvp:               this.extractTag(buffer, '00180060'),
      exposureTime:      this.extractTag(buffer, '00181150'),
      xRayTubeCurrent:   this.extractTag(buffer, '00181151'),
    };
  }

  private extractTag(buffer: Buffer, tag: string): string | null {
    try {
      const group   = parseInt(tag.substring(0, 4), 16);
      const element = parseInt(tag.substring(4, 8), 16);

      for (let i = 132; i < buffer.length - 8; i++) {
        if (buffer.readUInt16LE(i) === group &&
            buffer.readUInt16LE(i + 2) === element) {
          const length = buffer.readUInt16LE(i + 6);
          if (length > 0 && length < 256 && i + 8 + length <= buffer.length) {
            return buffer.toString('ascii', i + 8, i + 8 + length)
              .replace(/\0/g, '').trim();
          }
        }
      }
    } catch (_) {}
    return null;
  }
}
