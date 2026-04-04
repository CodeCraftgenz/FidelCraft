import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { slugifyName } from '../common/utils/slug.util';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.store.findMany({ where: { userId } });
  }

  async findById(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw AppException.notFound('Loja');
    return store;
  }

  async findBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        loyaltyPrograms: { where: { isActive: true }, include: { rewards: { where: { isActive: true } } } },
        user: { select: { id: true, name: true, plan: true } },
      },
    });
    if (!store) throw AppException.notFound('Loja');
    return store;
  }

  async create(userId: string, data: {
    name: string;
    description?: string;
    category?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat?: number;
    lng?: number;
    hours?: string;
  }) {
    let slug = slugifyName(data.name);
    const slugExists = await this.prisma.store.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return this.prisma.store.create({
      data: { userId, slug, ...data },
    });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    logoUrl: string;
    bannerUrl: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
    hours: string;
    theme: string;
    isPublished: boolean;
  }>) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store || store.userId !== userId) throw AppException.notFound('Loja');

    return this.prisma.store.update({ where: { id }, data });
  }

  async updateSlug(id: string, userId: string, newSlug: string) {
    const slug = slugifyName(newSlug);
    const existing = await this.prisma.store.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      throw AppException.conflict('Este slug ja esta em uso');
    }

    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store || store.userId !== userId) throw AppException.notFound('Loja');

    return this.prisma.store.update({ where: { id }, data: { slug } });
  }

  async trackView(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.storeView.upsert({
      where: { storeId_date: { storeId, date: today } },
      update: { count: { increment: 1 } },
      create: { storeId, date: today, count: 1 },
    });
  }
}
