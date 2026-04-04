import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async findByStoreId(storeId: string) {
    return this.prisma.loyaltyProgram.findMany({
      where: { storeId },
      include: { rewards: true, tiers: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id },
      include: { rewards: true, tiers: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!program) throw AppException.notFound('Programa');
    return program;
  }

  async findActiveByStoreId(storeId: string) {
    return this.prisma.loyaltyProgram.findMany({
      where: { storeId, isActive: true },
      include: {
        rewards: { where: { isActive: true } },
        tiers: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async create(storeId: string, userId: string, data: {
    name: string;
    description?: string;
    type: 'POINTS' | 'STAMPS' | 'CASHBACK';
    pointsPerCurrency?: number;
    stampsToReward?: number;
    cashbackPercent?: number;
    pointsExpireDays?: number;
    iconUrl?: string;
  }) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.userId !== userId) throw AppException.notFound('Loja');

    return this.prisma.loyaltyProgram.create({
      data: { storeId, ...data },
    });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    description: string;
    pointsPerCurrency: number;
    stampsToReward: number;
    cashbackPercent: number;
    pointsExpireDays: number;
    iconUrl: string;
    isActive: boolean;
  }>) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!program || program.store.userId !== userId) throw AppException.notFound('Programa');

    return this.prisma.loyaltyProgram.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!program || program.store.userId !== userId) throw AppException.notFound('Programa');

    return this.prisma.loyaltyProgram.delete({ where: { id } });
  }
}
