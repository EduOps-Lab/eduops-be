import { PrismaClient } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { EnrollmentStatus } from '../constants/enrollments.constant.js';
import { LectureStatus } from '../constants/lectures.constant.js';
import { getPagingParams } from '../utils/pagination.util.js';

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
        status: EnrollmentStatus.ACTIVE, // 기본적으로 수강중인 것만 조회
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
        status: EnrollmentStatus.ACTIVE, // 기본적으로 수강중인 것만 조회
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
    return await client.enrollment.findFirst({
      where: {
        id: enrollmentId,
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
        grades: {
          include: {
            exam: true,
          },
        },
        clinicTargets: {
          include: {
            clinic: true,
          },
        },
        attendances: true,
      },
    });
  }

  /** ID로 간단 조회 (권한 체크 및 기본 정보 확인용) */
  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findUnique({
      where: { id },
    });
  }

  /** 다수의 수강생 일괄 등록 */
  async createMany(
    dataList: Prisma.EnrollmentUncheckedCreateInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.createManyAndReturn({
      data: dataList,
    });
  }

  /** 수강 정보 수정 (Update) */
  async update(
    id: string,
    data: Prisma.EnrollmentUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.update({
      where: { id },
      data,
    });
  }

  /** Soft Delete */
  async softDelete(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return await client.enrollment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EnrollmentStatus.DROPPED, // 삭제 시 상태도 변경하는 것이 안전
      },
    });
  }

  /** 강의별 수강생 목록 조회 */
  async findManyByLectureId(lectureId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
      where: {
        lectureId,
        deletedAt: null,
      },
      include: {
        appStudent: true, // 학생 정보 포함
      },
      orderBy: {
        studentName: 'asc', // 이름순 정렬
      },
    });
  }

  /** 강사별 전체 수강생 목록 조회 (검색/필터/페이지네이션) */
  async findManyByInstructorId(
    instructorId: string,
    params: {
      page: number;
      pageSize: number;
      keyword?: string;
      year?: string;
      status?: EnrollmentStatus;
      includeClosed?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const { page, pageSize, keyword, year, status } = params;

    // 검색 조건 구성
    const where: Prisma.EnrollmentWhereInput = {
      instructorId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (year) {
      where.schoolYear = year;
    }

    if (keyword) {
      where.OR = [
        { studentName: { contains: keyword } },
        { school: { contains: keyword } },
        { studentPhone: { contains: keyword } },
        { parentPhone: { contains: keyword } },
      ];
    }

    // [New] 종강된 강의 제외 로직 (includeClosed가 true가 아니면 제외)
    if (!params.includeClosed) {
      where.lecture = {
        status: {
          not: LectureStatus.COMPLETED,
        },
      };
    }

    // 데이터 조회 (페이지네이션)
    const { skip, take } = getPagingParams(page, pageSize);
    const enrollments = await client.enrollment.findMany({
      where,
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
          },
        },
        appStudent: true,
      },
      orderBy: {
        registeredAt: 'desc', // 최신 등록순
      },
      skip,
      take,
    });

    // 전체 개수 조회 (페이지네이션 메타데이터용)
    const totalCount = await client.enrollment.count({ where });

    return {
      enrollments,
      totalCount,
    };
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

  /** 학부모 ID로 수강 목록 조회 (ParentChildLink를 통해) */
  async findByAppParentId(appParentId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    // 1. 학부모의 모든 자녀 연결 조회
    const links = await client.parentChildLink.findMany({
      where: { appParentId },
    });

    const linkIds = links.map((link) => link.id);

    // 2. 모든 자녀의 수강 정보 조회
    return await client.enrollment.findMany({
      where: {
        appParentLinkId: { in: linkIds },
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

  /** 수강 등록 (관리자/강사용) */
  async create(
    data: Prisma.EnrollmentUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.create({
      data,
    });
  }

  /** 전화번호 기준 AppStudentId 업데이트 (회원가입 시 연동) */
  async updateAppStudentIdByPhoneNumber(
    phoneNumber: string,
    appStudentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.updateMany({
      where: {
        studentPhone: phoneNumber,
        appStudentId: null, // 아직 연동되지 않은 건들만
      },
      data: {
        appStudentId,
      },
    });
  }
}
