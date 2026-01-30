import { Response } from 'express';

export const successResponse = (
  res: Response,
  {
    data,
    message,
    statusCode = 200,
  }: {
    data?: unknown;
    message?: string;
    statusCode?: number;
  },
) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
    message,
  });
};
