import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

export class AssistantCodeRepository {
  async findValidCode(code: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistantCode.findFirst({
      where: {
        code,
        isUsed: false,
        expireAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markAsUsed(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.assistantCode.update({
      where: { id },
      data: { isUsed: true },
    });
  }
}
