import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createRewardSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  pointsCost: z.number().int().min(1),
  imageUrl: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  minTier: z.string().optional(),
});

const updateRewardSchema = createRewardSchema.omit({ programId: true }).partial().extend({
  isActive: z.boolean().optional(),
});

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Public()
  @Get('program/:programId')
  async getByProgram(@Param('programId') programId: string) {
    return this.rewardsService.findByProgram(programId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createRewardSchema.parse(body);
    return this.rewardsService.create(data.programId, user.sub, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = updateRewardSchema.parse(body);
    return this.rewardsService.update(id, user.sub, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rewardsService.delete(id, user.sub);
  }

  // ─── Redeem ────────────────────────────────────────────────
  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(
    @CurrentUser() user: JwtPayload,
    @Param('id') rewardId: string,
    @Body() body: unknown,
  ) {
    const { memberId } = z.object({ memberId: z.string().uuid() }).parse(body);
    return this.rewardsService.redeemReward(rewardId, memberId, user.sub);
  }

  @Patch('redemptions/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeRedemption(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rewardsService.completeRedemption(id, user.sub);
  }

  @Get('store/:storeId/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingRedemptions(@Param('storeId') storeId: string) {
    return this.rewardsService.getPendingRedemptions(storeId);
  }
}
