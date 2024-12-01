import { PrismaClient } from "@prisma/client";

declare global {
  // Deklarasi global untuk mencegah multiple instance di mode development
  // Gunakan `let` untuk mendukung mode development
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
