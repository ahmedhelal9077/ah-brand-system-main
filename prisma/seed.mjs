import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingOwner = await prisma.user.findFirst({
    where: { role: 'OWNER' }
  });

  if (existingOwner) {
    console.log('Owner already exists!');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const owner = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  console.log(`Created owner user: ${owner.username} / admin123`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
