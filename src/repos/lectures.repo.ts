import type {
  Lecture,
  LectureTime,
  Instructor,
  PrismaClient,
  Prisma,
} from '../generated/prisma/client.js';
import { QueryMode } from '../generated/prisma/internal/prismaNamespace.js';
import { CreateLectureWithInstructorIdDto } from '../validations/lectures.validation.js';

type LectureWithTimes = Lecture & { lectureTimes: LectureTime[] };

export class LecturesRepository {
  constructor(private readonly prisma: PrismaClient) {}
  /** 강의 생성 */
  async create(
    data: CreateLectureWithInstructorIdDto,
    tx?: Prisma.TransactionClient,
  ): Promise<LectureWithTimes> {
    const client = tx ?? this.prisma;
    // Lecture 생성
    const lecture = await client.lecture.create({
      data: {
        instructorId: data.instructorId,
        title: data.title,
        subject: data.subject,
        description: data.description,
        endAt: data.endAt ? new Date(data.endAt) : null,
      },
    });

    // LectureTime 배열 생성 (day array 말고 문자열로)
    if (data.lectureTimes && data.lectureTimes.length > 0) {
      await client.lectureTime.createMany({
        data: data.lectureTimes.map((time) => ({
          lectureId: lecture.id,
          instructorId: data.instructorId,
          day: time.day,
          startTime: time.startTime,
          endTime: time.endTime,
        })),
      });
    }

    // lectureTimes 포함하여 반환
    const lectureWithTimes = await client.lecture.findUniqueOrThrow({
      where: { id: lecture.id },
      include: { lectureTimes: true },
    });

    return lectureWithTimes;
  }

  /** ID로 강의 조회 */
  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Lecture | null> {
    const client = tx ?? this.prisma;
    return await client.lecture.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /** ID로 강사 조회 (존재 확인용) */
  async findInstructorById(
    instructorId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Instructor | null> {
    const client = tx ?? this.prisma;
    return await client.instructor.findUnique({
      where: { id: instructorId, deletedAt: null }, // Soft delete 확인
    });
  }

  /** 강의 리스트 조회 (오프셋 기반 페이지네이션) */
  async findMany(options: {
    page: number;
    limit: number;
    instructorId?: string;
    search?: string;
  }): Promise<{ lectures: Lecture[]; totalCount: number }> {
    const { page, limit, instructorId, search } = options;

    const where: Prisma.LectureWhereInput = {
      deletedAt: null,
      instructorId: instructorId ? { equals: instructorId } : undefined,
      OR: search
        ? [
            { title: { contains: search, mode: QueryMode.insensitive } },
            { subject: { contains: search, mode: QueryMode.insensitive } },
          ]
        : undefined,
    };

    const [lectures, totalCount] = await Promise.all([
      this.prisma.lecture.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lecture.count({ where }),
    ]);

    return { lectures, totalCount };
  }

  /** ID로 강의 조회  */
  async findByIdWithRelations(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Lecture | null> {
    const client = tx ?? this.prisma;
    return await client.lecture.findUnique({
      where: { id, deletedAt: null },
      // TODO: 추후 instructor, assistants 관계 데이터 포함 가능 (담당 조교)
      // include: {
      //   instructor: {
      //     select: { id: true, name: true }
      //   }
      // }
    });
  }

  /** 강의 수정 */
  async update(
    id: string,
    data: Partial<{
      title: string;
      subject: string;
      description: string;
      endAt: Date | null;
    }>,
    tx?: Prisma.TransactionClient,
  ): Promise<Lecture> {
    const client = tx ?? this.prisma;
    return await client.lecture.update({
      where: { id, deletedAt: null },
      data,
    });
  }

  /** 강의 soft delete */
  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.lecture.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
