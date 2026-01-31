import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import type { SubmitGradingDto } from '../validations/grades.validation.js';

export class GradesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** 학생 답안 일괄 Upsert (Transaction 내에서 호출 권장) */
  async upsertStudentAnswers(
    lectureId: string,
    enrollmentId: string,
    answers: SubmitGradingDto['answers'],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // 반복문으로 Upsert 수행
    // 성능 최적화를 위해 Promise.all 사용
    const promises = answers.map((answer) => {
      // isCorrect 여부에 관계없이 모두 저장
      return client.studentAnswer.upsert({
        where: {
          enrollmentId_questionId: {
            enrollmentId,
            questionId: answer.questionId,
          },
        },
        create: {
          lectureId,
          enrollmentId,
          questionId: answer.questionId,
          submittedAnswer: answer.submittedAnswer,
          isCorrect: answer.isCorrect,
        },
        update: {
          submittedAnswer: answer.submittedAnswer,
          isCorrect: answer.isCorrect,
        },
      });
    });

    await Promise.all(promises);
  }

  /** 성적 Upsert */
  async upsertGrade(
    lectureId: string,
    examId: string,
    enrollmentId: string,
    score: number,
    isPass: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.grade.upsert({
      where: {
        examId_enrollmentId: {
          examId,
          enrollmentId,
        },
      },
      create: {
        lectureId,
        examId,
        enrollmentId,
        score,
        isPass,
      },
      update: {
        score,
        isPass,
      },
    });
  }

  /** 시험별 성적 목록 조회 (Enrollment 정보 포함) */
  async findGradesByExamId(examId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return await client.grade.findMany({
      where: { examId },
      include: {
        enrollment: {
          select: {
            id: true,
            studentName: true,
            studentPhone: true,
            school: true,
            schoolYear: true,
          },
        },
      },
      orderBy: { score: 'desc' }, // 점수 내림차순 정렬
    });
  }
}
