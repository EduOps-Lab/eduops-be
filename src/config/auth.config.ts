import { betterAuth } from 'better-auth';
import type { PrismaClient } from '../generated/prisma/client.js';
import { prisma } from './db.config.js';
import { config } from './env.config.js';

export const auth = betterAuth({
  database: prisma as unknown as PrismaClient,
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 나중에 활성화 가능
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
    cookiePrefix: 'eduops_auth',
    useSecureCookies: config.ENVIRONMENT === 'production',
  },

  trustedOrigins: config.FRONT_URL ? config.FRONT_URL.split(',') : [],
});
