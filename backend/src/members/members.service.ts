import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // ─── Public Registration ───────────────────────────────────
  async register(storeId: string, data: { name: string; email?: string; phone?: string; birthday?: Date }) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw AppException.notFound('Loja');

    // Check for duplicate
    if (data.phone) {
      const existing = await this.prisma.member.findUnique({
        where: { storeId_phone: { storeId, phone: data.phone } },
      });
      if (existing) return existing;
    }

    const member = await this.prisma.member.create({
      data: { storeId, ...data },
    });

    // Auto-join active programs
    const programs = await this.prisma.loyaltyProgram.findMany({
      where: { storeId, isActive: true },
    });

    if (programs.length > 0) {
      await this.prisma.memberProgram.createMany({
        data: programs.map((p: { id: string }) => ({
          memberId: member.id,
          programId: p.id,
        })),
      });
    }

    return member;
  }

  // ─── Magic Link Auth ───────────────────────────────────────
  async requestMagicLink(storeId: string, phone: string) {
    const member = await this.prisma.member.findUnique({
      where: { storeId_phone: { storeId, phone } },
    });
    if (!member) throw AppException.notFound('Membro');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.member.update({
      where: { id: member.id },
      data: { magicToken: token, magicTokenExp: expires },
    });

    return { token, memberId: member.id };
  }

  async validateMagicToken(token: string) {
    const member = await this.prisma.member.findUnique({
      where: { magicToken: token },
      include: {
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
        memberPrograms: {
          include: { program: { include: { rewards: { where: { isActive: true } } } } },
        },
      },
    });

    if (!member || !member.magicTokenExp || member.magicTokenExp < new Date()) {
      throw AppException.unauthorized('Token invalido ou expirado');
    }

    // Clear token after use
    await this.prisma.member.update({
      where: { id: member.id },
      data: { magicToken: null, magicTokenExp: null },
    });

    return member;
  }

  // ─── Lookup by QR ──────────────────────────────────────────
  async findByQrToken(qrCodeToken: string) {
    const member = await this.prisma.member.findUnique({
      where: { qrCodeToken },
      include: {
        memberPrograms: { include: { program: true } },
        store: { select: { id: true, name: true } },
      },
    });
    if (!member) throw AppException.notFound('Membro');
    return member;
  }

  // ─── Store Owner Operations ────────────────────────────────
  async findByStore(storeId: string, search?: string) {
    return this.prisma.member.findMany({
      where: {
        storeId,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      include: { memberPrograms: { include: { program: { select: { name: true, type: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        memberPrograms: { include: { program: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        redemptions: { include: { reward: true }, orderBy: { redeemedAt: 'desc' }, take: 10 },
      },
    });
    if (!member) throw AppException.notFound('Membro');
    return member;
  }

  async getMemberDashboard(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
        memberPrograms: {
          include: {
            program: {
              include: {
                rewards: { where: { isActive: true } },
                tiers: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!member) throw AppException.notFound('Membro');
    return member;
  }

  async getStoreStats(storeId: string) {
    const [totalMembers, activeMembers, newThisMonth] = await Promise.all([
      this.prisma.member.count({ where: { storeId } }),
      this.prisma.member.count({
        where: {
          storeId,
          transactions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        },
      }),
      this.prisma.member.count({
        where: {
          storeId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return { totalMembers, activeMembers, newThisMonth };
  }
}
