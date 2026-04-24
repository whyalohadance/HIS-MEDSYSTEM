import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LabService } from './lab.service';

@ApiTags('lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  // Tests catalog
  @Get('tests')
  async getTests() {
    const data = await this.labService.findAllTests();
    return { success: true, data };
  }

  @Post('tests')
  async createTest(@Body() dto: any) {
    const data = await this.labService.createTest(dto);
    return { success: true, data };
  }

  // Orders
  @Get('orders')
  async getOrders(@Query() filters: any) {
    const data = await this.labService.findAllOrders(filters);
    return { success: true, data };
  }

  @Get('worklist')
  async getWorklist() {
    const data = await this.labService.findWorklist();
    return { success: true, data };
  }

  @Get('stats')
  async getStats() {
    const data = await this.labService.getStats();
    return { success: true, data };
  }

  @Get('patient/:patientId')
  async getPatientOrders(@Param('patientId') patientId: string) {
    const data = await this.labService.findByPatient(+patientId);
    return { success: true, data };
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const data = await this.labService.findOrder(+id);
    return { success: true, data };
  }

  @Post('orders')
  async createOrder(@Body() dto: any, @Request() req: any) {
    const doctorId = req.user?.userId || req.user?.sub;
    const data = await this.labService.createOrder(doctorId, dto);
    return { success: true, data };
  }

  @Patch('orders/:id')
  async updateOrder(@Param('id') id: string, @Body() dto: any) {
    const data = await this.labService.updateOrder(+id, dto);
    return { success: true, data };
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string) {
    await this.labService.deleteOrder(+id);
    return { success: true };
  }

  // Results
  @Get('orders/:id/results')
  async getResults(@Param('id') id: string) {
    const data = await this.labService.findResults(+id);
    return { success: true, data };
  }

  @Post('orders/:id/results')
  async saveResults(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const labTechId = req.user?.userId || req.user?.sub;
    const data = await this.labService.saveResults(+id, labTechId, body.results || []);
    return { success: true, data };
  }
}
