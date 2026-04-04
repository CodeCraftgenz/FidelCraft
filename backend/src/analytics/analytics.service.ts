import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStoreViews(storeId: string, from: Date, to: Date) {
    return this.prisma.storeView.findMany({
      where: { storeId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
  }

  async getMemberGrowth(storeId: string, from: Date, to: Date) {
    const members = await this.prisma.member.findMany({
      where: { storeId, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    members.forEach((m: { createdAt: Date }) => {
      const date = m.createdAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  async getTransactionStats(storeId: string, from: Date, to: Date) {
    const [earned, redeemed, count] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { program: { storeId }, type: 'EARN', createdAt: { gte: from, lte: to } },
        _sum: { points: true, amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { program: { storeId }, type: 'REDEEM', createdAt: { gte: from, lte: to } },
        _sum: { points: true },
      }),
      this.prisma.transaction.count({
        where: { program: { storeId }, createdAt: { gte: from, lte: to } },
      }),
    ]);

    return {
      pointsEarned: earned._sum.points || 0,
      pointsRedeemed: Math.abs(redeemed._sum.points || 0),
      totalPurchaseAmount: earned._sum.amount || 0,
      transactionCount: count,
    };
  }

  async getTopMembers(storeId: string, limit = 10) {
    return this.prisma.member.findMany({
      where: { storeId },
      include: {
        memberPrograms: { select: { points: true, totalEarned: true, tierLevel: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { transactions: { _count: 'desc' } },
      take: limit,
    });
  }

  async getTopRewards(storeId: string, from: Date, to: Date) {
    const redemptions = await this.prisma.rewardRedemption.groupBy({
      by: ['rewardId'],
      where: {
        reward: { program: { storeId } },
        redeemedAt: { gte: from, lte: to },
      },
      _count: true,
      orderBy: { _count: { rewardId: 'desc' } },
      take: 5,
    });

    const rewardIds = redemptions.map((r: { rewardId: string }) => r.rewardId);
    const rewards = await this.prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, name: true },
    });

    const nameMap = new Map(rewards.map((r: { id: string; name: string }) => [r.id, r.name]));
    return redemptions.map((r: { rewardId: string; _count: number }) => ({
      rewardId: r.rewardId,
      rewardName: nameMap.get(r.rewardId) || 'Desconhecido',
      count: r._count,
    }));
  }

  async getEngagementRate(storeId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, active] = await Promise.all([
      this.prisma.member.count({ where: { storeId } }),
      this.prisma.member.count({
        where: {
          storeId,
          transactions: { some: { createdAt: { gte: thirtyDaysAgo } } },
        },
      }),
    ]);

    return {
      totalMembers: total,
      activeMembers: active,
      engagementRate: total > 0 ? ((active / total) * 100).toFixed(1) : '0',
    };
  }

  async getDashboardSummary(storeId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [members, transToday, transMonth, engagement] = await Promise.all([
      this.prisma.member.count({ where: { storeId } }),
      this.prisma.transaction.count({
        where: { program: { storeId }, createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.transaction.aggregate({
        where: { program: { storeId }, type: 'EARN', createdAt: { gte: startOfMonth } },
        _sum: { points: true },
      }),
      this.getEngagementRate(storeId),
    ]);

    return {
      totalMembers: members,
      transactionsToday: transToday,
      pointsEarnedThisMonth: transMonth._sum.points || 0,
      engagementRate: engagement.engagementRate,
    };
  }
}
