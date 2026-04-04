import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const PLAN_KEY = 'requiredPlan';
export const RequiresPlan = (...plans: string[]) =>
  Reflect.metadata(PLAN_KEY, plans);

const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPlans || requiredPlans.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.sub) throw new ForbiddenException('Acesso negado');

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { plan: true, role: true },
    });

    if (!dbUser) throw new ForbiddenException('Usuário não encontrado');
    if (dbUser.role === 'SUPER_ADMIN') return true;

    const userLevel = PLAN_HIERARCHY[dbUser.plan] ?? 0;
    const minRequired = Math.min(...requiredPlans.map((p) => PLAN_HIERARCHY[p] ?? 0));

    if (userLevel < minRequired) {
      throw new ForbiddenException(
        `Recurso disponivel a partir do plano ${requiredPlans[0]}. Seu plano atual: ${dbUser.plan}`,
      );
    }
    return true;
  }
}
