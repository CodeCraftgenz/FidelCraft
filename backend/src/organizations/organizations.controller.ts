import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyOrg(@CurrentUser() user: JwtPayload) {
    return this.orgsService.findByUser(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = z.object({ name: z.string().min(2).max(100), logoUrl: z.string().optional() }).parse(body);
    return this.orgsService.create(user.sub, data);
  }

  @Patch(':orgId')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string, @Body() body: unknown) {
    const data = z.object({ name: z.string().min(2).max(100).optional(), logoUrl: z.string().optional() }).parse(body);
    return this.orgsService.update(orgId, user.sub, data);
  }

  @Post(':orgId/invite')
  @UseGuards(JwtAuthGuard)
  async invite(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string, @Body() body: unknown) {
    const { email, role } = z.object({ email: z.string().email(), role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER') }).parse(body);
    return this.orgsService.invite(orgId, user.sub, email, role);
  }

  @Post('invite/:token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
    return this.orgsService.acceptInvite(token, user.sub);
  }

  @Delete(':orgId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  async removeMember(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string, @Param('memberId') memberId: string) {
    return this.orgsService.removeMember(orgId, user.sub, memberId);
  }

  @Patch(':orgId/members/:memberId/role')
  @UseGuards(JwtAuthGuard)
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() body: unknown,
  ) {
    const { role } = z.object({ role: z.enum(['ADMIN', 'MEMBER']) }).parse(body);
    return this.orgsService.updateMemberRole(orgId, user.sub, memberId, role);
  }

  @Get(':orgId/invites')
  @UseGuards(JwtAuthGuard)
  async getInvites(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgsService.getPendingInvites(orgId, user.sub);
  }

  @Delete(':orgId/invites/:inviteId')
  @UseGuards(JwtAuthGuard)
  async cancelInvite(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string, @Param('inviteId') inviteId: string) {
    return this.orgsService.cancelInvite(orgId, user.sub, inviteId);
  }
}
