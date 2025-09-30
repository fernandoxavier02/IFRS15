export const environment = {
  production: false,
  port: process.env['PORT'] || 3000,
  database: {
    url: process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/ifrs15_dev',
  },
  auth: {
    jwtSecret: process.env['JWT_SECRET'] || 'dev-secret-key',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    oidc: {
      issuerUrl: process.env['OIDC_ISSUER_URL'] || 'http://localhost:8080/auth/realms/ifrs15',
      clientId: process.env['OIDC_CLIENT_ID'] || 'ifrs15-api',
      clientSecret: process.env['OIDC_CLIENT_SECRET'] || 'dev-client-secret',
    },
  },
  cors: {
    origins: process.env['CORS_ORIGINS'] || 'http://localhost:4200',
  },
  telemetry: {
    serviceName: 'ifrs15-api',
    serviceVersion: '1.0.0',
    otlpEndpoint: process.env['OTLP_ENDPOINT'] || 'http://localhost:4317',
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'debug',
  },
};
