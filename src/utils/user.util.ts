import { Request } from 'express';
import { AuthResponse } from '../types/auth.types.js';

export const getAuthUser = (req: Request) => {
  const { user } = req as unknown as { user: AuthResponse['user'] };
  return user;
};
