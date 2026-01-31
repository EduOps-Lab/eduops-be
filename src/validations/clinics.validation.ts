import { z } from 'zod';

/** 클리닉 일괄 생성 요청 스키마 */
export const createClinicsSchema = z.object({
  title: z.string().optional(),
  deadline: z.string().datetime().optional(), // ISO 8601 string
  memo: z.string().optional(),
});

export type CreateClinicsDto = z.infer<typeof createClinicsSchema>;
