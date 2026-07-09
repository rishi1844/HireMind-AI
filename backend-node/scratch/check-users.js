const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      provider: true,
    }
  });
  console.log('--- RECENT USERS ---');
  console.log(users);
  
  const resumes = await prisma.builtResume.findMany({
    take: 5,
    select: {
      id: true,
      title: true,
      templateId: true,
      userId: true,
    }
  });
  console.log('--- RECENT BUILT RESUMES ---');
  console.log(resumes);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
