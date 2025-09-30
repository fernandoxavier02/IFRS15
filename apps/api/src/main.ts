import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cors from 'cors';
import * as compression from 'compression';
import { json, urlencoded } from 'express';

// Initialize OpenTelemetry before importing any other modules
import './telemetry/telemetry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });
  
  const configService = app.get(ConfigService);
  const logger = app.get(PinoLogger);
  
  app.useLogger(logger);
  
  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Request size limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  const corsOrigins = configService.get('CORS_ORIGINS', 'http://localhost:4200').split(',');
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('IFRS 15 Revenue Recognition API')
    .setDescription(`
      ## IFRS 15 Revenue Recognition System API
      
      This API provides comprehensive functionality for IFRS 15 revenue recognition including:
      
      ### Features
      - **Multi-tenant architecture** with row-level security
      - **OIDC authentication** with JWT tokens and RBAC
      - **Complete IFRS 15 implementation** (5-step model)
      - **Contract management** with performance obligations
      - **Revenue recognition** with allocation and timing
      - **Audit logging** and compliance reporting
      - **Real-time observability** with metrics and tracing
      
      ### Authentication
      Use the **Authorize** button to authenticate with your JWT token.
      
      ### Multi-tenancy
      Include the \`X-Tenant-ID\` header in your requests for tenant isolation.
    `)
    .setVersion('1.0.0')
    .setContact('IFRS 15 Team', 'https://ifrs15.example.com', 'support@ifrs15.example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.ifrs15.example.com', 'Production server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token (without "Bearer " prefix)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        in: 'header',
        description: 'Tenant ID for multi-tenant access',
      },
      'tenant-header',
    )
    .addTag('auth', 'Authentication and authorization')
    .addTag('contracts', 'Contract management and IFRS 15 steps')
    .addTag('customers', 'Customer and counterparty management')
    .addTag('revenue', 'Revenue recognition and allocation')
    .addTag('performance-obligations', 'Performance obligations tracking')
    .addTag('tenants', 'Multi-tenant management')
    .addTag('users', 'User management and profiles')
    .addTag('reports', 'Compliance and audit reports')
    .addTag('health', 'System health and monitoring')
    .addTag('metrics', 'Application metrics and observability')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'IFRS 15 API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3f51b5 }
    `,
  });

  // Health check endpoint (outside versioning)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: configService.get('NODE_ENV', 'development'),
    });
  });

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  
  await app.listen(port, host);

  const environment = configService.get('NODE_ENV', 'development');
  logger.log(`🚀 IFRS 15 API is running on: http://${host}:${port}/api/v1`);
  logger.log(`📚 Swagger documentation: http://${host}:${port}/api/docs`);
  logger.log(`🏥 Health check: http://${host}:${port}/health`);
  logger.log(`🔧 Environment: ${environment}`);
  logger.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error);
  process.exit(1);
});
