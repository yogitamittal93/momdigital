const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Querying yogi...');
    const user = await prisma.user.findUnique({
      where: { id: '699449ed-43f7-4050-b437-3e2b39c5fd9c' },
    });
    console.log('User profile:', JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
