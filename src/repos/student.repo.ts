import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateStudentData {
  userId: string;
  phoneNumber: string;
  school?: string;
}

export class StudentRepository {
  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.findUnique({ where: { userId } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.findUnique({ where: { id } });
  }

  async findByPhoneNumber(phoneNumber: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.findUnique({ where: { phoneNumber } });
  }

  async create(data: CreateStudentData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.create({ data });
  }
}
