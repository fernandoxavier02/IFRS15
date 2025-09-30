import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ifrs15/infra';
import { JwtPayload, User, UserRole, ROLE_PERMISSIONS } from '@ifrs15/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async validateUser(email: string, tenantId: string): Promise<User | null> {
    try {
      const user = await this.prisma.withTenant(tenantId, async () => {
        return await this.prisma.user.findUnique({
          where: {
            email_tenantId: {
              email,
              tenantId,
            },
          },
          include: {
            tenant: true,
          },
        });
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles: user.roles as UserRole[],
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error validating user', error);
      return null;
    }
  }

  async login(user: User): Promise<{ access_token: string; user: User }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    try {
      const user = await this.prisma.withTenant(payload.tenantId, async () => {
        return await this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            tenant: true,
          },
        });
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roles: user.roles as UserRole[],
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error validating JWT payload', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(user: User): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  hasRole(user: User, role: UserRole): boolean {
    return user.roles.includes(role);
  }

  hasAnyRole(user: User, roles: UserRole[]): boolean {
    return roles.some(role => user.roles.includes(role));
  }

  hasPermission(user: User, permission: string): boolean {
    // Check if user has any role that grants this permission
    return user.roles.some(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      return rolePermissions.includes(permission) || rolePermissions.includes('*');
    });
  }

  getUserPermissions(user: User): string[] {
    const permissions = new Set<string>();
    
    user.roles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }
}
