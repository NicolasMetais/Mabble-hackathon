import { Module } from '@nestjs/common';
import { TestModule } from './TestModule/test.module'
import { AuthModule } from './AuthModule/auth.module'
import { DatabaseModule } from './DatabaseModule/database.module'
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt.guard';
import { UserModule } from './UserModule/user.module';
import { ServicesModule } from './ServicesModule/services.module';


@Module({
  imports: [
    TestModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    ServicesModule,
    ConfigModule.forRoot({ isGlobal: true })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
