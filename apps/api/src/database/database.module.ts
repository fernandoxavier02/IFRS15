import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ifrs15/infra';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (configService: ConfigService) => {
        const prisma = new PrismaService();
        return prisma;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
