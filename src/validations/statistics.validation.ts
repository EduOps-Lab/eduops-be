// import { z } from 'zod';

// 통계 산출 요청 (POST)은 Body가 필요 없음 (URL Param examId만 사용)
// 통계 조회 요청 (GET)도 URL Param examId만 사용

/** 문항별 통계 DTO */
export type QuestionStatisticDto = {
  questionId: string;
  questionNumber?: number; // 편의상 추가
  totalSubmissions: number;
  correctRate: number;
  choiceRates: Record<string, number> | null;
};

/** 시험 전체 통계 응답 DTO */
export type GetExamStatisticsResponseDto = {
  examStats: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalExaminees: number;
    examDate: Date | null;
  };
  questionStats: QuestionStatisticDto[];
  studentStats: {
    enrollmentId: string;
    studentName: string;
    school: string | null;
    correctCount: number;
    score: number;
    rank: number;
    totalRank: number;
  }[];
};

// Zod 스키마는 Validation에 주로 쓰이며 Response Typing에는 필수가 아니므로 생략하거나 필요시 추가
// 여기서는 타입 위주로 정의함.
