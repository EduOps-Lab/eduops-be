import { PrismaClient } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { EnrollmentStatus } from '../constants/enrollments.constant.js';
import { LectureStatus } from '../constants/lectures.constant.js';
import { getPagingParams } from '../utils/pagination.util.js';
import { GetSvcEnrollmentsQueryDto } from '../validations/enrollments.validation.js';
import { QueryMode } from '../generated/prisma/internal/prismaNamespace.js';

export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** --- 조회 --- */

  /** 학생 ID로 수강 목록 조회 (Lecture, Instructor 포함) */
  async findByAppStudentId(
    appStudentId: string,
    query: Partial<GetSvcEnrollmentsQueryDto> = {},
    tx?: Prisma.TransactionClient,
  ) {
    return this.findManyWithPagination(
      { appStudentId, status: EnrollmentStatus.ACTIVE },
      query,
      tx,
    );
  }

  /** 학부모-자녀 연결 ID로 수강 목록 조회 (Lecture, Instructor 포함) */
  async findByAppParentLinkId(
    appParentLinkId: string,
    query: Partial<GetSvcEnrollmentsQueryDto> = {},
    tx?: Prisma.TransactionClient,
  ) {
    return this.findManyWithPagination(
      { appParentLinkId, status: EnrollmentStatus.ACTIVE },
      query,
      tx,
    );
  }

  /** 공통 페이징 조회 헬퍼 (Internal) */
  private async findManyWithPagination(
    baseWhere: Prisma.EnrollmentWhereInput,
    query: Partial<GetSvcEnrollmentsQueryDto>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const { page = 1, limit = 20, keyword } = query;
    const { skip, take } = getPagingParams(page, limit);

    const where: Prisma.EnrollmentWhereInput = {
      ...baseWhere,
      deletedAt: null,
    };

    if (keyword) {
      where.AND = [
        {
          OR: [
            {
              lecture: {
                title: { contains: keyword, mode: QueryMode.insensitive },
              },
            },
            {
              lecture: {
                subject: { contains: keyword, mode: QueryMode.insensitive },
              },
            },
            {
              lecture: {
                instructor: {
                  user: {
                    name: { contains: keyword, mode: QueryMode.insensitive },
                  },
                },
              },
            },
          ],
        },
      ];
    }

    const [enrollments, totalCount] = await Promise.all([
      client.enrollment.findMany({
        where,
        include: {
          lecture: {
            include: {
              instructor: {
                select: {
                  id: true,
                  subject: true,
                  phoneNumber: true,
                  academy: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: {
          registeredAt: 'desc',
        },
        skip,
        take,
      }),
      client.enrollment.count({ where }),
    ]);

    return { enrollments, totalCount };
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
        clinic: true,
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

  /** 강의별 수강생 목록 조회 (시험 성적 포함 옵션) */
  async findManyByLectureId(
    lectureId: string,
    options?: { examId?: string },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.findMany({
      where: {
        lectureId,
        deletedAt: null,
      },
      include: {
        appStudent: true, // 학생 정보 포함
        // examId가 있을 때만 grades를 조인하여 해당 시험의 성적만 가져옴
        ...(options?.examId && {
          grades: {
            where: { examId: options.examId },
            select: { id: true },
            take: 1, // 최대 1개만 (유니크 조건이 있으나 안전하게 처리)
          },
        }),
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
      limit: number;
      keyword?: string;
      year?: string;
      status?: EnrollmentStatus;
      includeClosed?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const { page, limit, keyword, year, status } = params;

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

    // 종강된 강의 제외 로직 (includeClosed가 true가 아니면 제외)
    if (!params.includeClosed) {
      where.lecture = {
        status: {
          not: LectureStatus.COMPLETED,
        },
      };
    }

    // 데이터 조회 (페이지네이션)
    const { skip, take } = getPagingParams(page, limit);
    const [enrollments, totalCount] = await Promise.all([
      client.enrollment.findMany({
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
      }),
      client.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      totalCount,
    };
  }

  /** --- 생성 --- */

  /** 수강생 일괄 등록 */
  async createMany(
    dataList: Prisma.EnrollmentUncheckedCreateInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.createManyAndReturn({
      data: dataList,
    });
  }

  /** 수강생 개별 등록 */
  async create(
    data: Prisma.EnrollmentUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.create({
      data,
    });
  }

  /** --- 수정 --- */

  /** 수강 정보 수정 */
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

  /** --- 삭제 --- */

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

  /** --- 연동 --- */

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
        appStudentId: null, // 아직 연동되지 않은 건들이만
      },
      data: {
        appStudentId,
      },
    });
  }

  /** 학생 전화번호 기준 AppParentLinkId 업데이트 (자녀 등록 시 연동) */
  async updateAppParentLinkIdByStudentPhone(
    studentPhone: string,
    appParentLinkId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return await client.enrollment.updateMany({
      where: {
        studentPhone: studentPhone,
        appParentLinkId: null, // 아직 연동되지 않은 건들이만
      },
      data: {
        appParentLinkId,
      },
    });
  }
}
