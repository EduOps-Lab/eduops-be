import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '../generated/prisma/client.js';
import { prisma } from './db.config.js';
import { config } from './env.config.js';
import { AUTH_COOKIE_PREFIX } from '../constants/auth.constant.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma as unknown as PrismaClient, {
    provider: 'postgresql',
  }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      userType: {
        type: 'string',
        required: true,
        defaultValue: 'STUDENT',
      },
    },
  },

  modelName: {
    user: 'user',
    session: 'session',
    account: 'account',
    verification: 'verification',
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24, // 1일마다 갱신
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5분 캐시
    },
  },

  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    useSecureCookies: config.ENVIRONMENT === 'production',
  },

  trustedOrigins: config.FRONT_URL ? config.FRONT_URL.split(',') : [],
});
