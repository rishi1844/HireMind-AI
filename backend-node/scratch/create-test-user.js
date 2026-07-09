const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'test_agent@example.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const existing = await prisma.user.findUnique({ where: { email } });
  
  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: true,
        provider: 'local',
        name: 'Test Agent',
      }
    });
    console.log('Updated existing test user:', email);
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Test Agent',
        password: hashedPassword,
        emailVerified: true,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    console.log('Created new verified test user:', email);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
