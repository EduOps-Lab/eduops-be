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

  /**
   * 강사의 클리닉 목록 조회
   */
  async findByInstructor(
    instructorId: string,
    filters?: {
      lectureId?: string;
      examId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const where: Prisma.ClinicWhereInput = {
      OR: [
        { instructorId }, // 직접 담당
        { lecture: { instructorId } }, // 강의 담당 강사로서 조회
      ],
      ...(filters?.lectureId && { lectureId: filters.lectureId }),
      ...(filters?.examId && { examId: filters.examId }),
    };

    return await client.clinic.findMany({
      where,
      include: {
        enrollment: {
          select: {
            id: true,
            studentName: true,
            school: true,
            schoolYear: true,
            studentPhone: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            cutoffScore: true,
            schedule: {
              select: {
                startTime: true,
              },
            },
          },
        },
        // Grade 정보를 가져오기 위해 Enrollment와 Exam 관계를 이용하거나 직접 Grade 조회 필요
        // Clinic 모델에는 직접적인 Grade 연결이 없으므로, examId + enrollmentId로 Grade를 조회하는 별도 로직이 필요할 수 있습니다.
        // 하지만 요구사항상 Grade 정보도 함께 내려줘야 하므로,
        // 여기서는 Prisma의 relation 기능을 활용해 간접적으로 가져오거나 Service 단에서 조합해야 합니다.
        // 효율성을 위해 Clinic에서 바로 Grade에 접근할 수 없으므로,
        // Service 단에서 Grade를 별도로 조회하여 병합하는 방식을 선택하거나,
        // 쿼리 최적화를 위해 여기서 한꺼번에 가져오는 방법을 고려해야 합니다.
        // 현재 스키마 구조상 Clinic -> Enrollment, Clinic -> Exam 관계는 있지만 Clinic -> Grade 관계는 없습니다.
        // 다만 Grade는 (examId, enrollmentId) 복합키를 가지므로 unique합니다.
        // Prisma include에서는 바로 접근이 어려우므로 Service에서 처리하겠습니다.
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
