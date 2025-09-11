import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global do ValidationPipe com transformação automática
  app.useGlobalPipes(new ValidationPipe(AppConfig.validation));

  // Configuração do Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle(AppConfig.swagger.title)
    .setDescription(AppConfig.swagger.description)
    .setVersion(AppConfig.swagger.version)
    .addBearerAuth(AppConfig.swagger.bearerAuth, AppConfig.swagger.authName)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: AppConfig.swagger.swaggerOptions,
    customSiteTitle: AppConfig.swagger.customSiteTitle,
    jsonDocumentUrl: '/api/docs/json',
  });

  // Ouve SIGINT/SIGTERM e dispara OnModuleDestroy/OnApplicationShutdown
  // Importante pra que o PrismaService desconecte do banco ao finalizar a aplicação
  app.enableShutdownHooks();

  await app.listen(AppConfig.server.port);
}
void bootstrap();
