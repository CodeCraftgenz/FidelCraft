import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FidelCraft...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fidelcraft.com' },
    update: {},
    create: {
      email: 'admin@fidelcraft.com',
      name: 'Admin FidelCraft',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      plan: 'ENTERPRISE',
    },
  });

  // Demo store owner
  const demoPassword = await bcrypt.hash('Demo1234!', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@fidelcraft.com' },
    update: {},
    create: {
      email: 'demo@fidelcraft.com',
      name: 'Joao Cafe',
      password: demoPassword,
      role: 'USER',
      plan: 'PRO',
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Demo store
  const store = await prisma.store.upsert({
    where: { slug: 'cafe-do-joao' },
    update: {},
    create: {
      userId: demo.id,
      slug: 'cafe-do-joao',
      name: 'Cafe do Joao',
      description: 'O melhor cafe artesanal da cidade. Graos selecionados e torrados na hora.',
      category: 'Cafeteria',
      phone: '11988888888',
      whatsapp: '11988888888',
      city: 'Sao Paulo',
      state: 'SP',
      isPublished: true,
    },
  });

  // Demo loyalty program (points)
  const program = await prisma.loyaltyProgram.upsert({
    where: { id: 'seed-program-points' },
    update: {},
    create: {
      id: 'seed-program-points',
      storeId: store.id,
      name: 'Programa de Pontos',
      description: 'Ganhe 1 ponto a cada R$1 gasto. Troque por premios!',
      type: 'POINTS',
      pointsPerCurrency: 1,
      pointsExpireDays: 180,
      isActive: true,
    },
  });

  // Demo stamps program
  await prisma.loyaltyProgram.upsert({
    where: { id: 'seed-program-stamps' },
    update: {},
    create: {
      id: 'seed-program-stamps',
      storeId: store.id,
      name: 'Cartao Fidelidade',
      description: 'A cada 10 cafes, ganhe 1 gratis!',
      type: 'STAMPS',
      stampsToReward: 10,
      isActive: true,
    },
  });

  // Tiers
  const tiers = [
    { name: 'Bronze', minPoints: 0, multiplier: 1.0, color: '#CD7F32' },
    { name: 'Prata', minPoints: 500, multiplier: 1.2, color: '#C0C0C0' },
    { name: 'Ouro', minPoints: 1500, multiplier: 1.5, color: '#FFD700' },
    { name: 'Diamante', minPoints: 5000, multiplier: 2.0, color: '#B9F2FF' },
  ];

  for (let i = 0; i < tiers.length; i++) {
    await prisma.tier.upsert({
      where: { programId_name: { programId: program.id, name: tiers[i].name } },
      update: {},
      create: { programId: program.id, sortOrder: i, ...tiers[i] },
    });
  }

  // Rewards
  const rewards = [
    { name: 'Cafe Expresso Gratis', pointsCost: 50, stock: null },
    { name: 'Bolo do Dia', pointsCost: 100, stock: 20 },
    { name: 'Combo Cafe + Bolo', pointsCost: 150, stock: null },
    { name: 'Caneca Exclusiva', pointsCost: 500, stock: 10, minTier: 'Prata' },
    { name: 'Kit Graos Especiais', pointsCost: 1000, stock: 5, minTier: 'Ouro' },
  ];

  for (let i = 0; i < rewards.length; i++) {
    await prisma.reward.upsert({
      where: { id: `seed-reward-${i}` },
      update: {},
      create: { id: `seed-reward-${i}`, programId: program.id, ...rewards[i] },
    });
  }

  // Demo members
  const members = [
    { name: 'Ana Costa', phone: '11977771111', email: 'ana@email.com' },
    { name: 'Bruno Santos', phone: '11977772222', email: 'bruno@email.com' },
    { name: 'Carla Souza', phone: '11977773333', email: 'carla@email.com' },
  ];

  for (const m of members) {
    const member = await prisma.member.upsert({
      where: { storeId_phone: { storeId: store.id, phone: m.phone } },
      update: {},
      create: { storeId: store.id, ...m },
    });

    // Join program
    await prisma.memberProgram.upsert({
      where: { memberId_programId: { memberId: member.id, programId: program.id } },
      update: {},
      create: { memberId: member.id, programId: program.id, points: 150, totalEarned: 150 },
    });
  }

  console.log('Seed completed!');
  console.log(`Admin: admin@fidelcraft.com / Admin123!`);
  console.log(`Demo:  demo@fidelcraft.com / Demo1234!`);
  console.log(`Store: /cafe-do-joao`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
