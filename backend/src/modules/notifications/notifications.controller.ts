import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getAll(@Request() req: any) {
    const data = await this.service.findAll(req.user.id);
    return { success: true, data };
  }

  @Get('unread-count')
  async unreadCount(@Request() req: any) {
    const data = await this.service.unreadCount(req.user.id);
    return { success: true, data };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.service.markAsRead(id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.service.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  @Post('test-cron')
  async testCron(@Request() req: any) {
    if (req.user?.role !== 'admin') {
      return { success: false, error: 'Only admin can trigger cron manually' };
    }
    await this.service.triggerAllCrons();
    return { success: true, message: 'All cron jobs triggered manually' };
  }
}
