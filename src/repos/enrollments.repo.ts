import { Prisma, PrismaClient } from '../generated/prisma/client.js';

export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** 학생 ID로 수강 목록 조회 (Lecture, Instructor 포함) */
  async findByAppStudentId(
    appStudentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
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
  async findByAppParentLinkId(
    appParentLinkId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
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
  async findByIdWithRelations(
    enrollmentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
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

  /** 학생 전화번호로 수강 목록 조회 */
  async findByStudentPhone(
    studentPhone: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
      where: {
        studentPhone,
        deletedAt: null,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
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

  /** 학부모 전화번호로 수강 목록 조회 */
  async findByParentPhone(parentPhone: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
      where: {
        parentPhone,
        deletedAt: null,
      },
      include: {
        lecture: {
          include: {
            instructor: {
              select: {
                id: true,
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

  /** ParentChildLink ID로 Parent ID 조회 */
  async findParentIdByParentChildLinkId(
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.parentChildLink.findUnique({
      where: { id },
      select: { appParentId: true },
    });
  }
}
