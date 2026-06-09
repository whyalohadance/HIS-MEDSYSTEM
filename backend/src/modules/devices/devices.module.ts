import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [], // Va fi adăugat în Pasul 2
  providers: [],   // Va fi adăugat în Pasul 2
  exports: [TypeOrmModule],
})
export class DevicesModule {}
