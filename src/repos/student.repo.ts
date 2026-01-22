import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateStudentData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  school?: string;
}

export class StudentRepository {
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.findUnique({ where: { email } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.findUnique({ where: { id } });
  }

  async create(data: CreateStudentData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appStudent.create({ data });
  }
}

export const studentRepo = new StudentRepository();
