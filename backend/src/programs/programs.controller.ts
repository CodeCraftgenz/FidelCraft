import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createProgramSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['POINTS', 'STAMPS', 'CASHBACK']),
  pointsPerCurrency: z.number().min(0).optional(),
  stampsToReward: z.number().int().min(1).optional(),
  cashbackPercent: z.number().min(0).max(100).optional(),
  pointsExpireDays: z.number().int().min(1).optional(),
  iconUrl: z.string().optional(),
});

const updateProgramSchema = createProgramSchema.omit({ storeId: true, type: true }).partial().extend({
  isActive: z.boolean().optional(),
});

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Public()
  @Get('store/:storeId')
  async getPublicPrograms(@Param('storeId') storeId: string) {
    return this.programsService.findActiveByStoreId(storeId);
  }

  @Get('me/store/:storeId')
  @UseGuards(JwtAuthGuard)
  async getMyPrograms(
    @CurrentUser() _user: JwtPayload,
    @Param('storeId') storeId: string,
  ) {
    return this.programsService.findByStoreId(storeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProgram(@Param('id') id: string) {
    return this.programsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProgram(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createProgramSchema.parse(body);
    return this.programsService.create(data.storeId, user.sub, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProgram(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateProgramSchema.parse(body);
    return this.programsService.update(id, user.sub, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProgram(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.programsService.delete(id, user.sub);
  }
}
