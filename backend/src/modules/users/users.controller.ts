import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Put, Patch, Delete, Body, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
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

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const data = await this.service.adminUpdateById(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteById(id);
    return { message: 'Пользователь удалён' };
  }
}
