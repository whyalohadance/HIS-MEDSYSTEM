import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('results')
@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private service: ResultsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id, req.user.role);
  }

  @Get(':id/preview')
  preview(@Param('id', ParseIntPipe) id: number) {
    return this.service.preview(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }
  }))
  create(@Body() dto: any, @UploadedFile() file: Express.Multer.File, @Request() req) {
    if (file) {
      dto.fileUrl = `http://localhost:3000/uploads/${file.filename}`;
    }
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.service.remove(id, req.user.id, req.user.role);
    return { message: 'Результат удалён' };
  }
}
