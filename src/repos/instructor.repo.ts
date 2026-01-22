import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateInstructorData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  subject?: string;
  academy?: string;
}

export class InstructorRepository {
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.instructor.findUnique({ where: { email } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.instructor.findUnique({ where: { id } });
  }

  async create(data: CreateInstructorData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.instructor.create({ data });
  }
}

export const instructorRepo = new InstructorRepository();
