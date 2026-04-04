import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Earn Points ───────────────────────────────────────────
  async earnPoints(data: {
    memberId: string;
    programId: string;
    amount: number;
    description?: string;
    createdById?: string;
  }) {
    const memberProgram = await this.prisma.memberProgram.findUnique({
      where: { memberId_programId: { memberId: data.memberId, programId: data.programId } },
      include: { program: true },
    });

    if (!memberProgram) throw AppException.notFound('Membro nao participa deste programa');

    const program = memberProgram.program;
    let points = 0;

    // Calculate points based on program type
    if (program.type === 'POINTS' && program.pointsPerCurrency) {
      points = Math.floor(data.amount * program.pointsPerCurrency);
    } else if (program.type === 'STAMPS') {
      points = 1; // 1 stamp per transaction
    } else if (program.type === 'CASHBACK' && program.cashbackPercent) {
      points = Math.floor(data.amount * (program.cashbackPercent / 100) * 100); // cents
    }

    if (points <= 0) throw AppException.badRequest('Nenhum ponto a creditar');

    // Check active campaigns for multiplier
    const now = new Date();
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        programId: data.programId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        type: 'DOUBLE_POINTS',
      },
    });

    if (campaign?.multiplier) {
      points = Math.floor(points * campaign.multiplier);
    }

    // Calculate expiration
    const expiresAt = program.pointsExpireDays
      ? new Date(Date.now() + program.pointsExpireDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create transaction and update balance
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          memberId: data.memberId,
          programId: data.programId,
          type: 'EARN',
          points,
          amount: data.amount,
          description: data.description || `Compra R$${data.amount.toFixed(2)}`,
          createdById: data.createdById,
          campaignId: campaign?.id,
          expiresAt,
        },
      }),
      this.prisma.memberProgram.update({
        where: { memberId_programId: { memberId: data.memberId, programId: data.programId } },
        data: {
          points: { increment: points },
          stamps: program.type === 'STAMPS' ? { increment: 1 } : undefined,
          totalEarned: { increment: points },
        },
      }),
    ]);

    // Check tier upgrade
    await this.checkTierUpgrade(data.memberId, data.programId);

    return { ...transaction, pointsEarned: points };
  }

  // ─── Redeem Points ─────────────────────────────────────────
  async redeemPoints(data: {
    memberId: string;
    programId: string;
    points: number;
    description?: string;
    createdById?: string;
  }) {
    const memberProgram = await this.prisma.memberProgram.findUnique({
      where: { memberId_programId: { memberId: data.memberId, programId: data.programId } },
    });

    if (!memberProgram) throw AppException.notFound('Membro nao participa deste programa');
    if (memberProgram.points < data.points) {
      throw AppException.badRequest(`Saldo insuficiente. Disponivel: ${memberProgram.points} pontos`);
    }

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          memberId: data.memberId,
          programId: data.programId,
          type: 'REDEEM',
          points: -data.points,
          description: data.description || 'Resgate de pontos',
          createdById: data.createdById,
        },
      }),
      this.prisma.memberProgram.update({
        where: { memberId_programId: { memberId: data.memberId, programId: data.programId } },
        data: {
          points: { decrement: data.points },
          totalSpent: { increment: data.points },
        },
      }),
    ]);

    return transaction;
  }

  // ─── Adjust Points (manual) ────────────────────────────────
  async adjustPoints(data: {
    memberId: string;
    programId: string;
    points: number;
    description: string;
    createdById: string;
  }) {
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          memberId: data.memberId,
          programId: data.programId,
          type: 'ADJUST',
          points: data.points,
          description: data.description,
          createdById: data.createdById,
        },
      }),
      this.prisma.memberProgram.update({
        where: { memberId_programId: { memberId: data.memberId, programId: data.programId } },
        data: {
          points: { increment: data.points },
          ...(data.points > 0 ? { totalEarned: { increment: data.points } } : {}),
        },
      }),
    ]);

    return transaction;
  }

  // ─── List Transactions ─────────────────────────────────────
  async findByMember(memberId: string, programId?: string) {
    return this.prisma.transaction.findMany({
      where: { memberId, ...(programId ? { programId } : {}) },
      include: { program: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findByStore(storeId: string, from?: Date, to?: Date) {
    return this.prisma.transaction.findMany({
      where: {
        program: { storeId },
        ...(from && to ? { createdAt: { gte: from, lte: to } } : {}),
      },
      include: {
        member: { select: { name: true, phone: true } },
        program: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getStoreTransactionStats(storeId: string, from: Date, to: Date) {
    const [totalEarned, totalRedeemed, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { program: { storeId }, type: 'EARN', createdAt: { gte: from, lte: to } },
        _sum: { points: true },
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
      totalEarned: totalEarned._sum.points || 0,
      totalRedeemed: Math.abs(totalRedeemed._sum.points || 0),
      transactionCount,
    };
  }

  // ─── Tier Check ────────────────────────────────────────────
  private async checkTierUpgrade(memberId: string, programId: string) {
    const memberProgram = await this.prisma.memberProgram.findUnique({
      where: { memberId_programId: { memberId, programId } },
    });
    if (!memberProgram) return;

    const tiers = await this.prisma.tier.findMany({
      where: { programId },
      orderBy: { minPoints: 'desc' },
    });

    for (const tier of tiers) {
      if (memberProgram.totalEarned >= tier.minPoints) {
        if (memberProgram.tierLevel !== tier.name) {
          await this.prisma.memberProgram.update({
            where: { memberId_programId: { memberId, programId } },
            data: { tierLevel: tier.name },
          });
        }
        break;
      }
    }
  }

  // ─── Expire Points (CRON) ─────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async expirePoints() {
    const now = new Date();
    const expiredTransactions = await this.prisma.transaction.findMany({
      where: {
        type: 'EARN',
        points: { gt: 0 },
        expiresAt: { lte: now },
      },
      include: { member: true },
    });

    let totalExpired = 0;

    for (const tx of expiredTransactions) {
      const memberProgram = await this.prisma.memberProgram.findUnique({
        where: { memberId_programId: { memberId: tx.memberId, programId: tx.programId } },
      });

      if (memberProgram && memberProgram.points > 0) {
        const pointsToExpire = Math.min(tx.points, memberProgram.points);

        await this.prisma.$transaction([
          this.prisma.transaction.create({
            data: {
              memberId: tx.memberId,
              programId: tx.programId,
              type: 'EXPIRE',
              points: -pointsToExpire,
              description: `Pontos expirados (transacao ${tx.id.slice(0, 8)})`,
            },
          }),
          this.prisma.memberProgram.update({
            where: { memberId_programId: { memberId: tx.memberId, programId: tx.programId } },
            data: { points: { decrement: pointsToExpire } },
          }),
          // Mark original transaction as processed by setting expiresAt to past
          this.prisma.transaction.update({
            where: { id: tx.id },
            data: { points: 0 },
          }),
        ]);

        totalExpired += pointsToExpire;
      }
    }

    if (totalExpired > 0) {
      this.logger.log(`Expired ${totalExpired} points across ${expiredTransactions.length} transactions`);
    }
  }
}
