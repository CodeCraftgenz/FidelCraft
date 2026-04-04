import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async findByStore(storeId: string) {
    return this.prisma.campaign.findMany({
      where: { storeId },
      include: { program: { select: { name: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive(storeId: string) {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: { storeId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    });
  }

  async create(storeId: string, userId: string, data: {
    programId?: string;
    name: string;
    description?: string;
    type: 'DOUBLE_POINTS' | 'BIRTHDAY' | 'REFERRAL' | 'SEASONAL' | 'WELCOME';
    multiplier?: number;
    bonusPoints?: number;
    startDate: Date;
    endDate: Date;
  }) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.userId !== userId) throw AppException.notFound('Loja');
    return this.prisma.campaign.create({ data: { storeId, ...data } });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string; description: string; multiplier: number; bonusPoints: number;
    startDate: Date; endDate: Date; isActive: boolean;
  }>) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: { store: true } });
    if (!campaign || campaign.store.userId !== userId) throw AppException.notFound('Campanha');
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: { store: true } });
    if (!campaign || campaign.store.userId !== userId) throw AppException.notFound('Campanha');
    return this.prisma.campaign.delete({ where: { id } });
  }
}
