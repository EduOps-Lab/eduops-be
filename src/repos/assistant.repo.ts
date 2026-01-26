import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateAssistantData {
  userId: string;
  phoneNumber: string;
  instructorId: string;
  signupCode: string;
}

export class AssistantRepository {
  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.findUnique({ where: { userId } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.findUnique({ where: { id } });
  }

  async findByPhoneNumber(phoneNumber: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.findFirst({ where: { phoneNumber } });
  }

  async create(data: CreateAssistantData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.create({ data });
  }
}
