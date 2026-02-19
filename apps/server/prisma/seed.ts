import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Create global settings
  await prisma.appSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      adminDevicePhone: '912345678',
    },
  });

  // Create admin profile
  const admin = await prisma.profile.upsert({
    where: { phone: '351912345678' },
    update: {},
    create: {
      phone: '351912345678',
      displayName: 'Admin',
      email: 'admin@selotropa.pt',
      district: 'Lisboa',
      registrationComplete: true,
      isAdmin: true,
      points: 100,
      level: 3,
      tier: 1,
    },
  });

  // Create a test user
  const user = await prisma.profile.upsert({
    where: { phone: '351923456789' },
    update: {},
    create: {
      phone: '351923456789',
      displayName: 'Maria',
      email: 'maria@example.com',
      district: 'Porto',
      registrationComplete: true,
      points: 50,
      level: 2,
      tier: 1,
    },
  });

  // Create an active collection
  const collection = await prisma.stampCollection.create({
    data: {
      name: 'MasterChef 2025',
      description: 'Colecao MasterChef com utensilios de cozinha premium',
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2025-12-31'),
      isActive: true,
      sortOrder: 1,
      createdBy: admin.id,
      items: {
        create: [
          {
            name: 'Conjunto de Facas',
            subtitle: '6 pecas em aco inox',
            sortOrder: 1,
            options: {
              create: [
                { stampsRequired: 20, feeEuros: 0, label: 'So selos', sortOrder: 1 },
                { stampsRequired: 10, feeEuros: 4.99, label: 'Selos + taxa', sortOrder: 2 },
              ],
            },
          },
          {
            name: 'Panela de Pressao',
            subtitle: '6L antiaderente',
            sortOrder: 2,
            options: {
              create: [
                { stampsRequired: 30, feeEuros: 0, label: 'So selos', sortOrder: 1 },
                { stampsRequired: 15, feeEuros: 9.99, label: 'Selos + taxa', sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed completed:', { admin: admin.id, user: user.id, collection: collection.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
