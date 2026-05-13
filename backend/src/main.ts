import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // CORS — должен быть ДО всего остального
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
    }
  });
  const allowedOrigins = [
    'http://localhost',
    'http://localhost:4200',
    'http://localhost:80',
    'http://127.0.0.1',
    'http://127.0.0.1:4200',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HIS-MedSystem API')
    .setDescription('Hospital Information System — REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('patients', 'Patients')
    .addTag('appointments', 'Appointments')
    .addTag('users', 'Users')
    .addTag('rooms', 'Rooms')
    .addTag('results', 'Results')
    .addTag('reports', 'Reports')
    .addTag('notifications', 'Notifications')
    .addTag('schedules', 'Schedules')
    .addTag('examinations', 'Examinations')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'HIS-MedSystem API Docs',
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 MedSystem API запущен на http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health check: http://localhost:${port}/api/health`);
}

bootstrap();
