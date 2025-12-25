import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/logging.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { appLogger } from './common/logger/winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: {
    // Разрешаем localhost:5173 (Vite по умолчанию), 5174 (если 5173 занят), и 3000
    origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
      .split(',')
      .map(s => s.trim()),
    credentials: true,
  }});
  // Attach request id
  app.use(new RequestIdMiddleware().use);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  // Also let Nest use our logger for internal logs
  app.useLogger({
    log: (message: any) => appLogger.info(typeof message === 'string' ? message : JSON.stringify(message)),
    error: (message: any) => appLogger.error(typeof message === 'string' ? message : JSON.stringify(message)),
    warn: (message: any) => appLogger.warn(typeof message === 'string' ? message : JSON.stringify(message)),
    debug: (message: any) => appLogger.debug(typeof message === 'string' ? message : JSON.stringify(message)),
    verbose: (message: any) => appLogger.verbose(typeof message === 'string' ? message : JSON.stringify(message)),
  });

  const config = new DocumentBuilder()
    .setTitle('Movie Aggregator API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(8080);
}
bootstrap();
