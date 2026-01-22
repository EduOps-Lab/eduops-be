import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateAssistantData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  instructorId: string;
  signupCode: string;
}

export class AssistantRepository {
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.findUnique({ where: { email } });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.findUnique({ where: { id } });
  }

  async create(data: CreateAssistantData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistant.create({ data });
  }
}

export const assistantRepo = new AssistantRepository();
