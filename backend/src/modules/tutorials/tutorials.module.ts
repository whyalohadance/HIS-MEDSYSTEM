import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorialProgress } from './tutorial-progress.entity';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';

@Module({
  imports: [TypeOrmModule.forFeature([TutorialProgress])],
  controllers: [TutorialsController],
  providers: [TutorialsService],
})
export class TutorialsModule {}
