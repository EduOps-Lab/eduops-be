import { Request } from 'express';
import { AuthResponse, ProfileBase } from '../types/auth.types.js';
import { UnauthorizedException } from '../err/http.exception.js';

export const getAuthUser = (req: Request) => {
  const { user } = req as unknown as { user: AuthResponse['user'] };
  return user;
};

export const getProfileOrThrow = (req: Request) => {
  const profile = (req as Request & { profile?: ProfileBase }).profile;
  if (!profile) {
    throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
  }
  return profile;
};

export const getProfileIdOrThrow = (req: Request) => {
  return getProfileOrThrow(req).id;
};
