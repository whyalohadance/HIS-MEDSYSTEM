import {
  Controller, Get, Post, Delete, Param, Body,
  Res, Req, UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { BackupService } from './backup.service';
import { RestoreBackupDto } from './dto/restore-backup.dto';

@ApiTags('backup')
@ApiBearerAuth()
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** List all backups */
  @Get()
  list() {
    return this.backupService.listBackups();
  }

  /** Create a new pg_dump backup */
  @Post('create')
  async create(@Req() req: Request) {
    const user = (req as any).user;
    const userId = user?.userId ?? user?.sub;
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || '').substring(0, 50);
    return this.backupService.createBackup(userId, ip);
  }

  /** Download a backup file (streams the .sql.gz) */
  @Get('download/:filename')
  async download(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const { stream, size } = await this.backupService.getBackupStream(filename);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', size);
    stream.pipe(res);
  }

  /** Restore DB from a backup — requires { confirmation: "RESTORE" } */
  @Post('restore/:filename')
  async restore(
    @Param('filename') filename: string,
    @Body() dto: RestoreBackupDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const userId = user?.userId ?? user?.sub;
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || '').substring(0, 50);
    return this.backupService.restoreBackup(filename, userId, ip);
  }

  /** Delete a backup file */
  @Delete(':filename')
  async deleteBackup(
    @Param('filename') filename: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const userId = user?.userId ?? user?.sub;
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || '').substring(0, 50);
    return this.backupService.deleteBackup(filename, userId, ip);
  }
}
