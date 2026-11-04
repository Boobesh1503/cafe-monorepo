import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

export async function getAvailableMenu() {
  return prisma.menuItem.findMany({
    where: { available: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      category: true,
      tags: true,
      available: true,
    },
  });
}
