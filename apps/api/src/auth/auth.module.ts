import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OidcStrategy } from './strategies/oidc.strategy';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RBACGuard } from './guards/rbac.guard';
import { AuditLogService } from './services/audit-log.service';
import { TenantService } from './services/tenant.service';
import { PolicySnapshotService } from './services/policy-snapshot.service';
import { TenantInterceptor } from './interceptors/tenant.interceptor';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OidcStrategy,
    RolesGuard,
    TenantGuard,
    RBACGuard,
    AuditLogService,
    TenantService,
    PolicySnapshotService,
    TenantInterceptor,
  ],
  exports: [
    AuthService, 
    RolesGuard, 
    TenantGuard, 
    RBACGuard,
    AuditLogService,
    TenantService,
    PolicySnapshotService,
    TenantInterceptor
  ],
})
export class AuthModule {}
