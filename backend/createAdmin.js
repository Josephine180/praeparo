import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin1234'; 

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    console.log('Admin déjà existant avec cet email.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      firstname: 'Super',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Admin créé :', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
