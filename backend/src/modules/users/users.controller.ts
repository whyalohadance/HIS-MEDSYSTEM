import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Put, Delete, Body, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from './user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  getMe(@Request() req) {
    return this.service.findById(req.user.id);
  }

  @Put('me')
  updateMe(@Request() req, @Body() body: any) {
    return this.service.updateById(req.user.id, body);
  }

  @Get('doctors')
  getDoctors() {
    return this.service.findByRole('doctor');
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteById(id);
    return { message: 'Пользователь удалён' };
  }
}
