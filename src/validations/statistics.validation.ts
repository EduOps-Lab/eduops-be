import { z } from 'zod';

// 통계 산출 요청 (POST)은 Body가 필요 없음 (URL Param examId만 사용)
// 통계 조회 요청 (GET)도 URL Param examId만 사용

/** 통계 응답 DTO (Frontend 전달용) */
export type ExamStatisticsDto = {
  questionId: string;
  totalSubmissions: number;
  correctRate: number;
  choiceRates: Record<string, number> | null;
};

export const examStatisticsDtoSchema = z.object({
  questionId: z.string(),
  totalSubmissions: z.number(),
  correctRate: z.number(),
  choiceRates: z.record(z.string(), z.number()).nullable(),
});
