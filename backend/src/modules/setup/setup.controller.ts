import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private setupService: SetupService) {}

  @Get('status')
  async getStatus() {
    return await this.setupService.checkSetupStatus();
  }

  @Post('initialize')
  async initialize(@Body() dto: any) {
    return await this.setupService.initialize(dto);
  }

  @Post('import-demo')
  async importDemo() {
    return await this.setupService.importDemoData();
  }
}
