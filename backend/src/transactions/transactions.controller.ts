import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const earnSchema = z.object({
  memberId: z.string().uuid(),
  programId: z.string().uuid(),
  amount: z.number().min(0.01),
  description: z.string().max(200).optional(),
});

const redeemSchema = z.object({
  memberId: z.string().uuid(),
  programId: z.string().uuid(),
  points: z.number().int().min(1),
  description: z.string().max(200).optional(),
});

const adjustSchema = z.object({
  memberId: z.string().uuid(),
  programId: z.string().uuid(),
  points: z.number().int(),
  description: z.string().min(1).max(200),
});

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ─── Store owner: Register purchase ────────────────────────
  @Post('earn')
  @UseGuards(JwtAuthGuard)
  async earn(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = earnSchema.parse(body);
    return this.transactionsService.earnPoints({ ...data, createdById: user.sub });
  }

  // ─── Store owner: Redeem points ────────────────────────────
  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = redeemSchema.parse(body);
    return this.transactionsService.redeemPoints({ ...data, createdById: user.sub });
  }

  // ─── Store owner: Manual adjust ────────────────────────────
  @Post('adjust')
  @UseGuards(JwtAuthGuard)
  async adjust(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = adjustSchema.parse(body);
    return this.transactionsService.adjustPoints({ ...data, createdById: user.sub });
  }

  // ─── Public: Member history ────────────────────────────────
  @Public()
  @Get('member/:memberId')
  async getMemberTransactions(
    @Param('memberId') memberId: string,
    @Query('programId') programId?: string,
  ) {
    return this.transactionsService.findByMember(memberId, programId);
  }

  // ─── Store owner: Store transactions ───────────────────────
  @Get('store/:storeId')
  @UseGuards(JwtAuthGuard)
  async getStoreTransactions(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.transactionsService.findByStore(
      storeId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('store/:storeId/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(
    @Param('storeId') storeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.transactionsService.getStoreTransactionStats(storeId, new Date(from), new Date(to));
  }
}
