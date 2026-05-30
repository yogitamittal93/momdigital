const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if test user already exists by email
  const existing = await prisma.user.findUnique({
    where: { email: 'yogita@test.com' }
  });

  if (existing) {
    console.log('✓ Test user already exists:');
    console.log(`  ID    : ${existing.id}`);
    console.log(`  Name  : ${existing.name}`);
    console.log(`  Email : ${existing.email}`);
    console.log(`  Role  : ${existing.role}`);
    console.log('\nUse this ID in your API calls:');
    console.log(`  "userId": "${existing.id}"`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: 'yogita@test.com',
      name: 'Yogita',
      role: 'MOTHER',
      dueDate: new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000)), // 28 weeks from now
    }
  });

  console.log('✓ Test user created successfully:');
  console.log(`  ID    : ${user.id}`);
  console.log(`  Name  : ${user.name}`);
  console.log(`  Email : ${user.email}`);
  console.log(`  Role  : ${user.role}`);
  console.log('\nUse this ID in your API calls:');
  console.log(`  "userId": "${user.id}"`);
}

main()
  .catch(e => {
    console.error('✗ Seed error:', e.message);
  })
  .finally(() => prisma.$disconnect());