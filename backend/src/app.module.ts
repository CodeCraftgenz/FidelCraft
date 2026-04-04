import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './common/config/configuration';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { ProgramsModule } from './programs/programs.module';
import { RewardsModule } from './rewards/rewards.module';
import { MembersModule } from './members/members.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TiersModule } from './tiers/tiers.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { StaffModule } from './staff/staff.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoresModule,
    ProgramsModule,
    RewardsModule,
    MembersModule,
    TransactionsModule,
    CampaignsModule,
    TiersModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    OrganizationsModule,
    StaffModule,
    MailModule,
    StorageModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
