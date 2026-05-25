import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TutorialsService } from './tutorials.service';

@Controller('tutorials')
@UseGuards(JwtAuthGuard)
export class TutorialsController {
  constructor(private tutorialsService: TutorialsService) {}

  @Get('list')
  getList(@Request() req: any) {
    return { success: true, data: this.tutorialsService.getTutorials(req.user?.role) };
  }

  @Get('progress')
  async getProgress(@Request() req: any) {
    const data = await this.tutorialsService.getUserProgress(req.user.id);
    return { success: true, data };
  }

  @Post('complete/:tutorialId')
  async markComplete(
    @Param('tutorialId') tutorialId: string,
    @Request() req: any,
    @Body() body: { rating?: number },
  ) {
    const data = await this.tutorialsService.markComplete(req.user.id, tutorialId, body.rating);
    return { success: true, data };
  }
}
