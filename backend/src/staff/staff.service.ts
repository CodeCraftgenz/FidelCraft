import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findByStore(storeId: string) {
    return this.prisma.staffMember.findMany({
      where: { storeId },
      select: { id: true, storeId: true, name: true, email: true, isActive: true, createdAt: true },
    });
  }

  async create(storeId: string, userId: string, data: { name: string; email: string; pin: string }) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.userId !== userId) throw AppException.notFound('Loja');

    if (data.pin.length !== 4 || !/^\d+$/.test(data.pin)) {
      throw AppException.badRequest('PIN deve ter 4 digitos numericos');
    }

    const hashedPin = await bcrypt.hash(data.pin, 10);

    return this.prisma.staffMember.create({
      data: { storeId, name: data.name, email: data.email, pin: hashedPin },
      select: { id: true, storeId: true, name: true, email: true, isActive: true, createdAt: true },
    });
  }

  async update(id: string, userId: string, data: { name?: string; email?: string; isActive?: boolean }) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!staff || staff.store.userId !== userId) throw AppException.notFound('Funcionario');

    return this.prisma.staffMember.update({
      where: { id },
      data,
      select: { id: true, storeId: true, name: true, email: true, isActive: true, createdAt: true },
    });
  }

  async resetPin(id: string, userId: string, newPin: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!staff || staff.store.userId !== userId) throw AppException.notFound('Funcionario');

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      throw AppException.badRequest('PIN deve ter 4 digitos numericos');
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    return this.prisma.staffMember.update({
      where: { id },
      data: { pin: hashedPin },
      select: { id: true, name: true },
    });
  }

  async delete(id: string, userId: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!staff || staff.store.userId !== userId) throw AppException.notFound('Funcionario');

    return this.prisma.staffMember.delete({ where: { id } });
  }

  // Quick auth for staff at POS
  async authenticateByPin(storeId: string, email: string, pin: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { storeId_email: { storeId, email } },
    });
    if (!staff || !staff.isActive) throw AppException.unauthorized('Funcionario nao encontrado');

    const valid = await bcrypt.compare(pin, staff.pin);
    if (!valid) throw AppException.unauthorized('PIN invalido');

    return { staffId: staff.id, name: staff.name, storeId: staff.storeId };
  }
}
