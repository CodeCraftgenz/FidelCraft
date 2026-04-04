import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('store/:storeId/dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Param('storeId') storeId: string) {
    return this.analyticsService.getDashboardSummary(storeId);
  }

  @Get('store/:storeId/views')
  @UseGuards(JwtAuthGuard)
  async getViews(@Param('storeId') storeId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.getStoreViews(storeId, new Date(from), new Date(to));
  }

  @Get('store/:storeId/members')
  @UseGuards(JwtAuthGuard)
  async getMemberGrowth(@Param('storeId') storeId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.getMemberGrowth(storeId, new Date(from), new Date(to));
  }

  @Get('store/:storeId/transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(@Param('storeId') storeId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.getTransactionStats(storeId, new Date(from), new Date(to));
  }

  @Get('store/:storeId/top-members')
  @UseGuards(JwtAuthGuard)
  async getTopMembers(@Param('storeId') storeId: string) {
    return this.analyticsService.getTopMembers(storeId);
  }

  @Get('store/:storeId/top-rewards')
  @UseGuards(JwtAuthGuard)
  async getTopRewards(@Param('storeId') storeId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.getTopRewards(storeId, new Date(from), new Date(to));
  }

  @Get('store/:storeId/engagement')
  @UseGuards(JwtAuthGuard)
  async getEngagement(@Param('storeId') storeId: string) {
    return this.analyticsService.getEngagementRate(storeId);
  }
}
