import { prisma } from '../config/db.config.js';
import type { Prisma } from '../generated/prisma/client.js';

interface CreateSessionData {
  userId: string;
  userType: string;
  token: string;
  expiresAt: Date;
}

export class SessionRepository {
  async findByToken(token: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.session.findUnique({ where: { token } });
  }

  async create(data: CreateSessionData, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.session.create({ data });
  }

  async deleteByToken(token: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.session.delete({ where: { token } }).catch(() => null);
  }

  async deleteByUserIdAndType(
    userId: string,
    userType: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.session
      .delete({
        where: {
          userId_userType: {
            userId,
            userType,
          },
        },
      })
      .catch(() => null);
  }
}

export const sessionRepo = new SessionRepository();
