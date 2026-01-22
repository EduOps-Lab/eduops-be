import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateParentData {
  email: string;
  password: string;
  phoneNumber: string;
}

export class ParentRepository {
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appParent.findUnique({ where: { email } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appParent.findUnique({ where: { id } });
  }

  async create(data: CreateParentData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appParent.create({ data });
  }
}

export const parentRepo = new ParentRepository();
