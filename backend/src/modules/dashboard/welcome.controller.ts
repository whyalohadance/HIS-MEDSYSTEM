import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WelcomeService } from './welcome.service';

@Controller('welcome')
@UseGuards(JwtAuthGuard)
export class WelcomeController {
  constructor(private welcomeService: WelcomeService) {}

  @Get('progress')
  async getProgress() {
    const data = await this.welcomeService.getSetupProgress();
    return { success: true, data };
  }

  @Get('clinic')
  async getClinic() {
    const data = await this.welcomeService.getClinicSettings();
    return { success: true, data };
  }
}
