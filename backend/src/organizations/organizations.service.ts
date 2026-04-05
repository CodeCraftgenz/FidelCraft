import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppException } from '../common/exceptions/app.exception';
import { slugifyName } from '../common/utils/slug.util';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findByUser(userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
          },
        },
      },
    });
    return membership?.organization || null;
  }

  async create(userId: string, data: { name: string; logoUrl?: string }) {
    const existing = await this.prisma.organizationMember.findUnique({ where: { userId } });
    if (existing) throw AppException.conflict('Voce ja pertence a uma organizacao');

    let slug = slugifyName(data.name);
    const slugExists = await this.prisma.organization.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug,
        logoUrl: data.logoUrl,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: true },
    });

    return org;
  }

  async update(orgId: string, userId: string, data: { name?: string; logoUrl?: string }) {
    await this.ensureRole(orgId, userId, 'ADMIN');
    return this.prisma.organization.update({ where: { id: orgId }, data });
  }

  async invite(orgId: string, userId: string, email: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
    await this.ensureRole(orgId, userId, 'ADMIN');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.organizationMember.findUnique({ where: { userId: existingUser.id } });
      if (existingMember) throw AppException.conflict('Este usuario ja pertence a uma organizacao');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.organizationInvite.create({
      data: { organizationId: orgId, email, role: role as any, token, expiresAt },
    });

    // TODO: send invite email
    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.organizationInvite.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      throw AppException.badRequest('Convite invalido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invite.email) {
      throw AppException.forbidden('Este convite nao pertence a voce');
    }

    const existing = await this.prisma.organizationMember.findUnique({ where: { userId } });
    if (existing) throw AppException.conflict('Voce ja pertence a uma organizacao');

    await this.prisma.$transaction([
      this.prisma.organizationMember.create({
        data: { organizationId: invite.organizationId, userId, role: invite.role },
      }),
      this.prisma.organizationInvite.delete({ where: { id: invite.id } }),
    ]);

    return { message: 'Convite aceito' };
  }

  async removeMember(orgId: string, userId: string, memberId: string) {
    await this.ensureRole(orgId, userId, 'ADMIN');

    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: memberId },
    });
    if (!member) throw AppException.notFound('Membro');
    if (member.role === 'OWNER') throw AppException.forbidden('Nao e possivel remover o proprietario');

    return this.prisma.organizationMember.delete({ where: { id: member.id } });
  }

  async updateMemberRole(orgId: string, userId: string, memberId: string, role: 'ADMIN' | 'MEMBER') {
    await this.ensureRole(orgId, userId, 'OWNER');

    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: memberId },
    });
    if (!member) throw AppException.notFound('Membro');
    if (member.role === 'OWNER') throw AppException.forbidden('Nao e possivel alterar o role do proprietario');

    return this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { role: role as any },
    });
  }

  async getPendingInvites(orgId: string, userId: string) {
    await this.ensureRole(orgId, userId, 'ADMIN');
    return this.prisma.organizationInvite.findMany({
      where: { organizationId: orgId, expiresAt: { gt: new Date() } },
    });
  }

  async cancelInvite(orgId: string, userId: string, inviteId: string) {
    await this.ensureRole(orgId, userId, 'ADMIN');
    return this.prisma.organizationInvite.delete({ where: { id: inviteId } });
  }

  private async ensureRole(orgId: string, userId: string, minRole: 'MEMBER' | 'ADMIN' | 'OWNER') {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!member) throw AppException.forbidden('Voce nao pertence a esta organizacao');

    const hierarchy: Record<string, number> = { MEMBER: 1, ADMIN: 2, OWNER: 3 };
    if ((hierarchy[member.role] || 0) < (hierarchy[minRole] || 0)) {
      throw AppException.forbidden('Permissao insuficiente');
    }
  }
}
