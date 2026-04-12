import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudiesService } from './studies.service';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';

@ApiTags('studies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies')
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Get()
  async findAll(@Query() filters: any) {
    const data = await this.studiesService.findAll(filters);
    return { success: true, data };
  }

  @Get('worklist')
  async getWorklist() {
    const data = await this.studiesService.findWorklist();
    return { success: true, data };
  }

  @Get('stats')
  async getStats() {
    const data = await this.studiesService.getStats();
    return { success: true, data };
  }

  @Get('modalities/all')
  async findModalities() {
    const data = await this.studiesService.findAllModalities();
    return { success: true, data };
  }

  @Post('modalities')
  async createModality(@Body() dto: any) {
    const data = await this.studiesService.createModality(dto);
    return { success: true, data };
  }

  @Patch('modalities/:id')
  async updateModality(@Param('id') id: string, @Body() dto: any) {
    const data = await this.studiesService.updateModality(+id, dto);
    return { success: true, data };
  }

  @Delete('modalities/:id')
  async removeModality(@Param('id') id: string) {
    await this.studiesService.removeModality(+id);
    return { success: true };
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.studiesService.findByPatient(+patientId);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.studiesService.findOne(+id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateStudyDto) {
    const data = await this.studiesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStudyDto) {
    const data = await this.studiesService.update(+id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.studiesService.remove(+id);
    return { success: true };
  }
}
