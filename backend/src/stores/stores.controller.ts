import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const createStoreSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  instagram: z.string().max(100).optional(),
  website: z.string().url().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  hours: z.string().optional(),
});

const updateStoreSchema = createStoreSchema.partial().extend({
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  theme: z.string().optional(),
  isPublished: z.boolean().optional(),
});

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Public()
  @Get(':slug')
  async getPublicStore(@Param('slug') slug: string) {
    const store = await this.storesService.findBySlug(slug);
    await this.storesService.trackView(store.id);
    return store;
  }

  @Get('me/stores')
  @UseGuards(JwtAuthGuard)
  async getMyStores(@CurrentUser() user: JwtPayload) {
    return this.storesService.findByUserId(user.sub);
  }

  @Post('me/stores')
  @UseGuards(JwtAuthGuard)
  async createStore(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createStoreSchema.parse(body);
    return this.storesService.create(user.sub, data);
  }

  @Patch('me/stores/:id')
  @UseGuards(JwtAuthGuard)
  async updateStore(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateStoreSchema.parse(body);
    return this.storesService.update(id, user.sub, data);
  }

  @Patch('me/stores/:id/slug')
  @UseGuards(JwtAuthGuard)
  async updateSlug(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const { slug } = z.object({ slug: z.string().min(2).max(40) }).parse(body);
    return this.storesService.updateSlug(id, user.sub, slug);
  }
}
