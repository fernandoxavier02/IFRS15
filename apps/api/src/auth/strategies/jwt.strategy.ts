import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '@ifrs15/shared';
import { UserRole } from '../enums/user-role.enum';
import { AuthenticatedUser } from '../guards/rbac.guard';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Extract tenant_id and role from JWT payload
    const tenantId = payload.tenant_id || payload.tenantId || user.tenantId;
    const role = payload.role || user.role;
    const contractIds = payload.contract_ids || payload.contractIds || user.contractIds;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID not found in token');
    }

    if (!Object.values(UserRole).includes(role)) {
      throw new UnauthorizedException('Invalid user role');
    }

    return {
      id: user.id,
      email: user.email,
      role: role as UserRole,
      tenantId,
      permissions: payload.permissions,
      contractIds: contractIds || []
    };
  }
}
