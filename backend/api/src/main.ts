import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false //mettre a true pour les cookies mais plus tard wesh
  })

  app.useGlobalPipes(
    new ValidationPipe({ //j'active le rejet du DTO
      whitelist: true, //supprime les champs pas definis dans les DTO
      forbidNonWhitelisted: true, //je rejette directe la requete si il y a une data que je ne connais pas
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
