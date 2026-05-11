import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

const MONTH_NAMES_LAT = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

function contentDisposition(latName: string, lang: string, ext: string): string {
  const filename = `report_${latName}_${lang}`;
  const encoded = encodeURIComponent(`${filename}.${ext}`);
  return `attachment; filename="${filename}.${ext}"; filename*=UTF-8''${encoded}`;
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('summary')
  async getSummary(@Query('month') month: string, @Query('year') year: string) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    return this.service.getReportData(m, y);
  }

  @Get('stats')
  async getStats(@Query('year') year: string, @Query('month') month: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const data = await this.service.getMonthlyStats(y, m);
    return { success: true, data };
  }

  @Get('yearly-stats')
  async getYearlyStats(@Query('year') year: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const data = await this.service.getYearlyStats(y);
    return { success: true, data };
  }

  @Get('pdf')
  async downloadPDF(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('lang') lang: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const l = lang || 'ro';
    const latName = `${MONTH_NAMES_LAT[m - 1]}_${y}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition(latName, l, 'pdf'));
    await this.service.generatePDF(m, y, l, res);
  }

  @Get('excel')
  async downloadExcel(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('lang') lang: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const l = lang || 'ro';
    const latName = `${MONTH_NAMES_LAT[m - 1]}_${y}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', contentDisposition(latName, l, 'xlsx'));
    await this.service.generateExcel(m, y, l, res);
  }
}
