import { PrismaClient, Prisma } from '../generated/prisma/client.js';

export class ClinicsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 해당 시험의 불합격 성적 조회 (Enrollment 정보 포함)
   * isPass = false 인 Grade 조회
   */
  async findFailedGradesByExamId(
    examId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.grade.findMany({
      where: {
        examId,
        isPass: false,
      },
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
    });
  }

  /**
   * 이미 생성된 클리닉 조회 (중복 방지용)
   */
  async findExistingClinics(
    examId: string,
    enrollmentIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.clinic.findMany({
      where: {
        examId,
        enrollmentId: {
          in: enrollmentIds,
        },
      },
      select: {
        enrollmentId: true,
      },
    });
  }

  /**
   * 클리닉 일괄 생성
   */
  async createMany(
    data: Array<{
      lectureId: string;
      examId: string;
      enrollmentId: string;
      title: string;
      deadline?: Date | null;
      memo?: string;
      instructorId?: string;
    }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    return await client.clinic.createMany({
      data: data.map((item) => ({
        lectureId: item.lectureId,
        examId: item.examId,
        enrollmentId: item.enrollmentId,
        title: item.title,
        deadline: item.deadline,
        memo: item.memo,
        instructorId: item.instructorId,
        status: 'PENDING',
        notificationStatus: 'READY',
      })),
      skipDuplicates: true, // 중복 키 에러 방지 (@@unique([enrollmentId, examId]))
    });
  }
}
