import { PrismaClient, UserRole, EntityStatus, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // 1. Crear a la Administradora
  const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Dummy UUID para auth
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@phalay.com' },
    update: {},
    create: {
      email: 'admin@phalay.com',
      firstName: 'Elena',
      lastName: 'Rivas',
      role: UserRole.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
      emailVerified: true,
      supabaseAuthId: adminId, 
    },
  });
  console.log(`✅ Administradora creada: ${admin.email}`);

  // 2. System Settings
  await prisma.systemSettings.create({
    data: {
      storeName: 'PHALAY Digital Atelier',
      contactEmail: 'contacto@phalay.com'
    }
  });
  console.log(`✅ System settings creados`);

  // 3. Crear Categorías Básicas
  const categoryVestidos = await prisma.productCategory.upsert({
    where: { slug: 'vestidos-gala' },
    update: {},
    create: {
      name: 'Vestidos de Gala',
      slug: 'vestidos-gala',
      isActive: true,
    }
  });

  const categorySastreria = await prisma.productCategory.upsert({
    where: { slug: 'sastreria' },
    update: {},
    create: {
      name: 'Sastrería Moderna',
      slug: 'sastreria',
      isActive: true,
    }
  });
  console.log(`✅ Categorías creadas`);

  // 4. Crear Productos de Demostración
  const p1 = await prisma.product.upsert({
    where: { slug: 'vestido-aura-seda' },
    update: {},
    create: {
      categoryId: categoryVestidos.id,
      name: 'Vestido Aura Seda',
      slug: 'vestido-aura-seda',
      sku: 'PH-VS-001',
      description: 'Hermoso vestido de seda natural con caída elegante, ideal para eventos de gala.',
      shortDescription: 'Colección Eterna • 100% Seda Natural',
      price: 450.00,
      status: ProductStatus.ACTIVE,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80', isMain: true }
        ]
      }
    }
  });

  const p2 = await prisma.product.upsert({
    where: { slug: 'blazer-estructura-linum' },
    update: {},
    create: {
      categoryId: categorySastreria.id,
      name: 'Blazer Estructura Linum',
      slug: 'blazer-estructura-linum',
      sku: 'PH-BL-002',
      description: 'Blazer estructurado en lino premium. Perfecto para un look sofisticado de oficina.',
      shortDescription: 'Línea Sastrería • Lino Premium',
      price: 320.00,
      status: ProductStatus.ACTIVE,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80', isMain: true }
        ]
      }
    }
  });

  console.log(`✅ Productos creados: ${p1.name}, ${p2.name}`);
  console.log('🎉 Seeding completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
