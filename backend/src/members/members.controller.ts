import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const registerSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  birthday: z.string().transform((s) => new Date(s)).optional(),
});

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // ─── Public: Register as member ────────────────────────────
  @Public()
  @Post('register')
  async register(@Body() body: unknown) {
    const data = registerSchema.parse(body);
    return this.membersService.register(data.storeId, data);
  }

  // ─── Public: Magic link auth ───────────────────────────────
  @Public()
  @Post('magic-link')
  async requestMagicLink(@Body() body: unknown) {
    const { storeId, phone } = z
      .object({ storeId: z.string().uuid(), phone: z.string() })
      .parse(body);
    return this.membersService.requestMagicLink(storeId, phone);
  }

  @Public()
  @Get('auth/:token')
  async validateToken(@Param('token') token: string) {
    return this.membersService.validateMagicToken(token);
  }

  // ─── Public: QR lookup ─────────────────────────────────────
  @Public()
  @Get('qr/:qrToken')
  async findByQr(@Param('qrToken') qrToken: string) {
    return this.membersService.findByQrToken(qrToken);
  }

  // ─── Public: Member dashboard ──────────────────────────────
  @Public()
  @Get('dashboard/:memberId')
  async getMemberDashboard(@Param('memberId') memberId: string) {
    return this.membersService.getMemberDashboard(memberId);
  }

  // ─── Store owner: List members ─────────────────────────────
  @Get('store/:storeId')
  @UseGuards(JwtAuthGuard)
  async getStoreMembers(
    @Param('storeId') storeId: string,
    @Query('search') search?: string,
  ) {
    return this.membersService.findByStore(storeId, search);
  }

  @Get('store/:storeId/stats')
  @UseGuards(JwtAuthGuard)
  async getStoreStats(@Param('storeId') storeId: string) {
    return this.membersService.getStoreStats(storeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMember(@Param('id') id: string) {
    return this.membersService.findById(id);
  }
}
