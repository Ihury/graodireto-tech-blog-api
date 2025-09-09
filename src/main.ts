import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ouve SIGINT/SIGTERM e dispara OnModuleDestroy/OnApplicationShutdown
  // Importante pra que o PrismaService desconecte do banco ao finalizar a aplicação
  await app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
