import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createCampaignSchema = z.object({
  storeId: z.string().uuid(),
  programId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['DOUBLE_POINTS', 'BIRTHDAY', 'REFERRAL', 'SEASONAL', 'WELCOME']),
  multiplier: z.number().min(1).optional(),
  bonusPoints: z.number().int().min(1).optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
});

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('store/:storeId')
  @UseGuards(JwtAuthGuard)
  async getAll(@Param('storeId') storeId: string) { return this.campaignsService.findByStore(storeId); }

  @Get('store/:storeId/active')
  @UseGuards(JwtAuthGuard)
  async getActive(@Param('storeId') storeId: string) { return this.campaignsService.findActive(storeId); }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createCampaignSchema.parse(body);
    return this.campaignsService.create(data.storeId, user.sub, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = createCampaignSchema.partial().omit({ storeId: true }).parse(body);
    return this.campaignsService.update(id, user.sub, data as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.campaignsService.delete(id, user.sub);
  }
}
