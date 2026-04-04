import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class TiersService {
  constructor(private prisma: PrismaService) {}

  async findByProgram(programId: string) {
    return this.prisma.tier.findMany({ where: { programId }, orderBy: { sortOrder: 'asc' } });
  }

  async create(programId: string, userId: string, data: {
    name: string; minPoints: number; multiplier?: number; benefits?: string; color?: string;
  }) {
    const program = await this.prisma.loyaltyProgram.findUnique({ where: { id: programId }, include: { store: true } });
    if (!program || program.store.userId !== userId) throw AppException.notFound('Programa');
    const count = await this.prisma.tier.count({ where: { programId } });
    return this.prisma.tier.create({ data: { programId, sortOrder: count, multiplier: data.multiplier || 1.0, ...data } });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string; minPoints: number; multiplier: number; benefits: string; color: string; sortOrder: number;
  }>) {
    const tier = await this.prisma.tier.findUnique({ where: { id }, include: { program: { include: { store: true } } } });
    if (!tier || tier.program.store.userId !== userId) throw AppException.notFound('Tier');
    return this.prisma.tier.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const tier = await this.prisma.tier.findUnique({ where: { id }, include: { program: { include: { store: true } } } });
    if (!tier || tier.program.store.userId !== userId) throw AppException.notFound('Tier');
    return this.prisma.tier.delete({ where: { id } });
  }
}
