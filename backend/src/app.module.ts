import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
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
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    HealthModule,
  ],
})
export class AppModule {}
