export const environment = {
  production: true,
  port: process.env['PORT'] || 3000,
  database: {
    url: process.env['DATABASE_URL'] || '',
  },
  auth: {
    jwtSecret: process.env['JWT_SECRET'] || '',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    oidc: {
      issuerUrl: process.env['OIDC_ISSUER_URL'] || '',
      clientId: process.env['OIDC_CLIENT_ID'] || '',
      clientSecret: process.env['OIDC_CLIENT_SECRET'] || '',
    },
  },
  cors: {
    origins: process.env['CORS_ORIGINS'] || '',
  },
  telemetry: {
    serviceName: 'ifrs15-api',
    serviceVersion: '1.0.0',
    otlpEndpoint: process.env['OTLP_ENDPOINT'] || '',
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
};
