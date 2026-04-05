import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createStaffSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  pin: z.string().length(4).regex(/^\d+$/),
});

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('store/:storeId')
  @UseGuards(JwtAuthGuard)
  async getByStore(@Param('storeId') storeId: string) {
    return this.staffService.findByStore(storeId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createStaffSchema.parse(body);
    return this.staffService.create(data.storeId, user.sub, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = z.object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      isActive: z.boolean().optional(),
    }).parse(body);
    return this.staffService.update(id, user.sub, data);
  }

  @Patch(':id/pin')
  @UseGuards(JwtAuthGuard)
  async resetPin(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const { pin } = z.object({ pin: z.string().length(4).regex(/^\d+$/) }).parse(body);
    return this.staffService.resetPin(id, user.sub, pin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.staffService.delete(id, user.sub);
  }

  // Quick PIN auth for POS terminal
  @Public()
  @Post('auth')
  async authenticate(@Body() body: unknown) {
    const { storeId, email, pin } = z.object({
      storeId: z.string().uuid(),
      email: z.string().email(),
      pin: z.string().length(4),
    }).parse(body);
    return this.staffService.authenticateByPin(storeId, email, pin);
  }
}
