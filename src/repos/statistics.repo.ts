import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import type { QuestionStatistic } from '../generated/prisma/client.js';

export class StatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** 문항별 통계 데이터 Upsert (Transaction 지원) */
  async upsertQuestionStatistic(
    examId: string,
    questionId: string,
    data: {
      totalSubmissions: number;
      correctRate: number;
      choiceRates: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<QuestionStatistic> {
    const client = tx ?? this.prisma;

    return await client.questionStatistic.upsert({
      where: {
        questionId,
      },
      create: {
        examId,
        questionId,
        totalSubmissions: data.totalSubmissions,
        correctRate: data.correctRate,
        choiceRates: data.choiceRates,
      },
      update: {
        examId, // 혹시 모르니 업데이트
        totalSubmissions: data.totalSubmissions,
        correctRate: data.correctRate,
        choiceRates: data.choiceRates,
      },
    });
  }

  /** 시험의 모든 문항 통계 조회 */
  async findStatisticsByExamId(
    examId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<QuestionStatistic[]> {
    const client = tx ?? this.prisma;
    return await client.questionStatistic.findMany({
      where: { examId },
      orderBy: { questionId: 'asc' }, // 문항 생성 순서가 ID 정렬과 일치한다고 가정 (혹은 questionNumber 조인 필요할 수도 있음)
    });
  }

  /**
   * [Raw Data] 시험 ID로 성적 제출자 수 조회 (통계 분모)
   * Grade 테이블에 레코드가 있는 경우만 카운트
   */
  async countGradesByExamId(
    examId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return await client.grade.count({
      where: { examId },
    });
  }

  /**
   * [Raw Data] 문항별 학생 답안 목록 조회 (통계 산출용)
   */
  async findStudentAnswersByQuestionId(
    questionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.studentAnswer.findMany({
      where: { questionId },
      select: {
        submittedAnswer: true,
        isCorrect: true,
      },
    });
  }

  // 통계 계산을 위한 Raw Data 조회 메서드는 Service에서 GradesRepo 등을 조합해서 처리하는 것이
  // 책임 분리상 적절할 수 있으나, 편의를 위해 여기에 배치할 수도 있습니다.
  // 일단 Core 기능인 Statistic 테이블 조작에 집중합니다.
}
