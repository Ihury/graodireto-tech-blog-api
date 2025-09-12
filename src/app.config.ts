export const AppConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  },

  validation: {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  },

  swagger: {
    title: 'Tech Blog API',
    description: 'API do blog de tecnologia da Grão Direto',
    version: '1.0',
    bearerAuth: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Token JWT para autenticação',
      in: 'header' as const,
    },
    authName: 'JWT-auth',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Tech Blog API - Documentação',
  },

  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  },

  bcrypt: {
    saltRounds: process.env.BCRYPT_SALT_ROUNDS
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
      : 12,
  },
} as const;
