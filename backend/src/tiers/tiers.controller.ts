import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TiersService } from './tiers.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createTierSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(1).max(50),
  minPoints: z.number().int().min(0),
  multiplier: z.number().min(1).optional(),
  benefits: z.string().max(1000).optional(),
  color: z.string().max(7).optional(),
});

@Controller('tiers')
export class TiersController {
  constructor(private readonly tiersService: TiersService) {}

  @Public()
  @Get('program/:programId')
  async getByProgram(@Param('programId') programId: string) { return this.tiersService.findByProgram(programId); }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createTierSchema.parse(body);
    return this.tiersService.create(data.programId, user.sub, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = createTierSchema.partial().omit({ programId: true }).parse(body);
    return this.tiersService.update(id, user.sub, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.tiersService.delete(id, user.sub); }
}
