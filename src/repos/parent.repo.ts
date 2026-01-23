import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateParentData {
  userId: string;
  phoneNumber: string;
}

export class ParentRepository {
  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appParent.findUnique({ where: { userId } });
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
