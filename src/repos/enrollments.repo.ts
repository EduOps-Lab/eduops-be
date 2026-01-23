import { PrismaClient } from '../generated/prisma/client.js';

export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** 학생 ID로 수강 목록 조회 (Lecture, Instructor 포함) */
  async findByAppStudentId(appStudentId: string) {
    return await this.prisma.enrollment.findMany({
      where: {
        appStudentId,
        deletedAt: null,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                subject: true,
                phoneNumber: true,
                academy: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });
  }

  /** 학부모-자녀 연결 ID로 수강 목록 조회 (Lecture, Instructor 포함) */
  async findByAppParentLinkId(appParentLinkId: string) {
    return await this.prisma.enrollment.findMany({
      where: {
        appParentLinkId,
        deletedAt: null,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                subject: true,
                phoneNumber: true,
                academy: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });
  }

  /** Enrollment ID로 상세 조회 (관계 포함) */
  async findByIdWithRelations(enrollmentId: string) {
    return await this.prisma.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                subject: true,
                phoneNumber: true,
                academy: true,
              },
            },
          },
        },
      },
    });
  }
}
