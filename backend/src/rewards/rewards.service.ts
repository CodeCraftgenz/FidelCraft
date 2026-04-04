import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class RewardsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async findByProgram(programId: string) {
    return this.prisma.reward.findMany({
      where: { programId },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async create(programId: string, userId: string, data: {
    name: string;
    description?: string;
    pointsCost: number;
    imageUrl?: string;
    stock?: number;
    minTier?: string;
  }) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
      include: { store: true },
    });
    if (!program || program.store.userId !== userId) throw AppException.notFound('Programa');

    return this.prisma.reward.create({
      data: { programId, ...data },
    });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    description: string;
    pointsCost: number;
    imageUrl: string;
    stock: number;
    minTier: string;
    isActive: boolean;
  }>) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: { program: { include: { store: true } } },
    });
    if (!reward || reward.program.store.userId !== userId) throw AppException.notFound('Premio');

    return this.prisma.reward.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: { program: { include: { store: true } } },
    });
    if (!reward || reward.program.store.userId !== userId) throw AppException.notFound('Premio');

    return this.prisma.reward.delete({ where: { id } });
  }

  // ─── Redeem Reward ─────────────────────────────────────────
  async redeemReward(rewardId: string, memberId: string, createdById?: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      include: { program: true },
    });
    if (!reward || !reward.isActive) throw AppException.notFound('Premio');

    // Check stock
    if (reward.stock !== null && reward.stock <= 0) {
      throw AppException.badRequest('Premio esgotado');
    }

    // Check member tier
    if (reward.minTier) {
      const memberProgram = await this.prisma.memberProgram.findUnique({
        where: { memberId_programId: { memberId, programId: reward.programId } },
      });
      if (!memberProgram) throw AppException.notFound('Membro nao participa deste programa');

      const tierOrder: Record<string, number> = { Bronze: 0, Prata: 1, Ouro: 2, Diamante: 3 };
      if ((tierOrder[memberProgram.tierLevel] || 0) < (tierOrder[reward.minTier] || 0)) {
        throw AppException.forbidden(`Nivel minimo: ${reward.minTier}`);
      }
    }

    // Debit points
    await this.transactionsService.redeemPoints({
      memberId,
      programId: reward.programId,
      points: reward.pointsCost,
      description: `Resgate: ${reward.name}`,
      createdById,
    });

    // Create redemption record
    const redemption = await this.prisma.rewardRedemption.create({
      data: {
        memberId,
        rewardId,
        pointsSpent: reward.pointsCost,
      },
    });

    // Decrease stock
    if (reward.stock !== null) {
      await this.prisma.reward.update({
        where: { id: rewardId },
        data: { stock: { decrement: 1 } },
      });
    }

    return redemption;
  }

  async completeRedemption(id: string, userId: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id },
      include: { reward: { include: { program: { include: { store: true } } } } },
    });
    if (!redemption || redemption.reward.program.store.userId !== userId) {
      throw AppException.notFound('Resgate');
    }

    return this.prisma.rewardRedemption.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async getPendingRedemptions(storeId: string) {
    return this.prisma.rewardRedemption.findMany({
      where: {
        status: 'PENDING',
        reward: { program: { storeId } },
      },
      include: {
        member: { select: { name: true, phone: true } },
        reward: { select: { name: true, pointsCost: true } },
      },
      orderBy: { redeemedAt: 'desc' },
    });
  }
}
