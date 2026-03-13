import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('file')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + extname(file.originalname));
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowed = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
      if (!allowed.test(file.originalname)) {
        return cb(new Error('Недопустимый тип файла'), false);
      }
      cb(null, true);
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
    return {
      success: true,
      data: {
        fileName: file.originalname,
        fileUrl,
        size: file.size,
        mimetype: file.mimetype
      }
    };
  }
}
