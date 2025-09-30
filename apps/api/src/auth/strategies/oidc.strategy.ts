import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthService } from '../auth.service';
import { JwtPayload } from '@ifrs15/shared';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('OIDC_ISSUER_URL')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: (req) => {
        // Extract JWT from Authorization header or cookie
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.substring(7);
        }
        return req.cookies?.access_token || null;
      },
      audience: configService.get('OIDC_CLIENT_ID'),
      issuer: configService.get('OIDC_ISSUER_URL'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // Map OIDC payload to our internal user format
    const jwtPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenant_id || payload.organization_id,
      roles: payload.roles || [],
      iat: payload.iat,
      exp: payload.exp,
    };

    const user = await this.authService.validateJwtPayload(jwtPayload);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
