import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  ENVIRONMENT: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().min(1000).max(65535),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  FRONT_URL: z.string(),
});

const parseEnvironment = () => {
  try {
    return envSchema.parse({
      ENVIRONMENT: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL,
      FRONT_URL: process.env.FRONT_URL,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('error.errors', err);
    }
    process.exit(1);
  }
};

export const config = parseEnvironment();

export const isDevelopment = () => config.ENVIRONMENT === 'development';
export const isProduction = () => config.ENVIRONMENT === 'production';
export const isTest = () => config.ENVIRONMENT === 'test';
