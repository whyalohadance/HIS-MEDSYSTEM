import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { StudiesService } from './studies.service';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';

@ApiTags('studies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
@Controller('studies')
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST, UserRole.DOCTOR)
  async findAll(@Query() filters: any) {
    const data = await this.studiesService.findAll(filters);
    return { success: true, data };
  }

  @Get('worklist')
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
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
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
  async createModality(@Body() dto: any) {
    const data = await this.studiesService.createModality(dto);
    return { success: true, data };
  }

  @Patch('modalities/:id')
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
  async updateModality(@Param('id') id: string, @Body() dto: any) {
    const data = await this.studiesService.updateModality(+id, dto);
    return { success: true, data };
  }

  @Delete('modalities/:id')
  @Roles(UserRole.ADMIN)
  async removeModality(@Param('id') id: string) {
    await this.studiesService.removeModality(+id);
    return { success: true };
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.studiesService.findByPatient(+patientId);
    return { success: true, data };
  }

  @Get(':id/hierarchy')
  async getHierarchy(@Param('id') id: string) {
    const study = await this.studiesService.findOne(+id);
    const series = await this.studiesService.findSeriesByStudy(+id);
    const seriesWithImages = await Promise.all(
      series.map(async s => ({
        ...s,
        images: await this.studiesService.findImagesBySeries(s.id)
      }))
    );
    return {
      success: true,
      data: {
        study,
        series: seriesWithImages,
        stats: {
          totalSeries: series.length,
          totalImages: seriesWithImages.reduce((acc, s) => acc + s.images.length, 0)
        }
      }
    };
  }

  @Get(':id/report-pdf')
  async getReportPDF(
    @Param('id') id: string,
    @Query('lang') lang: string,
    @Res() res: Response,
  ) {
    await this.studiesService.generateReportPDF(+id, lang || 'ro', res);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.studiesService.findOne(+id);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
  async create(@Body() dto: CreateStudyDto) {
    const data = await this.studiesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
  async update(@Param('id') id: string, @Body() dto: UpdateStudyDto) {
    const data = await this.studiesService.update(+id, dto);
    return { success: true, data };
  }

  // ===== MEASUREMENTS — fixed paths before :id =====
  @Get(':id/measurements')
  async getMeasurements(@Param('id') id: string) {
    const data = await this.studiesService.findMeasurements(+id);
    return { success: true, data };
  }

  @Post(':id/measurements')
  async addMeasurement(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const data = await this.studiesService.createMeasurement(+id, userId, dto);
    return { success: true, data };
  }

  @Delete('measurements/:measurementId')
  async removeMeasurement(@Param('measurementId') measurementId: string) {
    await this.studiesService.deleteMeasurement(+measurementId);
    return { success: true };
  }

  @Delete(':id/measurements')
  async removeAllMeasurements(@Param('id') id: string) {
    await this.studiesService.deleteAllMeasurements(+id);
    return { success: true };
  }

  // ===== ANNOTATIONS — fixed paths before :id =====
  @Get(':id/annotations')
  async getAnnotations(@Param('id') id: string) {
    const data = await this.studiesService.findAnnotations(+id);
    return { success: true, data };
  }

  @Post(':id/annotations')
  async addAnnotation(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const data = await this.studiesService.createAnnotation(+id, userId, dto);
    return { success: true, data };
  }

  @Delete('annotations/:annotationId')
  async removeAnnotation(@Param('annotationId') annotationId: string) {
    await this.studiesService.deleteAnnotation(+annotationId);
    return { success: true };
  }

  @Delete(':id/annotations')
  async removeAllAnnotations(@Param('id') id: string) {
    await this.studiesService.deleteAllAnnotations(+id);
    return { success: true };
  }

  @Post(':id/report')
  @Roles(UserRole.ADMIN, UserRole.RADIOLOGIST)
  async saveReport(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const data = await this.studiesService.saveReport(+id, userId, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.studiesService.remove(+id);
    return { success: true };
  }
}
