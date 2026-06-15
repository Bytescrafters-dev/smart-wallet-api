import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json } from 'express';

async function bootstrap() {
  if (process.env.SCHEDULER_ONLY === 'true') {
    const ctx = await NestFactory.createApplicationContext(AppModule);
    await ctx.init();
    console.log('Scheduler running');
    return;
  }

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '15mb' }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(8000);
  console.log('API http://localhost:8000');
}
bootstrap();
