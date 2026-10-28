import 'reflect-metadata';
import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

export async function createApp(options: NestApplicationOptions = {}) {
  const app = await NestFactory.create(AppModule, options);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));
  app.enableShutdownHooks();
  return app;
}

if (require.main === module) {
  createApp().then((app) => app.listen(process.env.PORT ?? 3000)).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
