import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.env.TZ = 'Asia/Ho_Chi_Minh'; // Set timezone to UTC+7
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all for MVP dev, or 'http://localhost:3000' for stricter
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
