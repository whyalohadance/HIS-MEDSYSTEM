import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

// Латинские транслитерации месяцев для ASCII-совместимого filename
const MONTH_NAMES_RU  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTH_NAMES_LAT = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

/**
 * RFC 6266: filename*=UTF-8''<percent-encoded> для Unicode имён.
 * filename= — ASCII-совместимый фоллбэк для старых клиентов.
 */
function contentDisposition(ruName: string, asciiName: string, ext: string): string {
  const encoded = encodeURIComponent(`report_${ruName}.${ext}`);
  return `attachment; filename="report_${asciiName}.${ext}"; filename*=UTF-8''${encoded}`;
}

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

  @Get('pdf')
  async downloadPDF(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generatePDF(m, y);
    const ruName  = `${MONTH_NAMES_RU[m - 1]}_${y}`;
    const latName = `${MONTH_NAMES_LAT[m - 1]}_${y}`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(ruName, latName, 'pdf'),
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('excel')
  async downloadExcel(
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.generateExcel(m, y);
    const ruName  = `${MONTH_NAMES_RU[m - 1]}_${y}`;
    const latName = `${MONTH_NAMES_LAT[m - 1]}_${y}`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': contentDisposition(ruName, latName, 'xlsx'),
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
