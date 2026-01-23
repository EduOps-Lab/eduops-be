import { prisma } from '../config/db.config.js';
import { Lecture, Instructor } from '../generated/prisma/client.js';
import { CreateLectureDto } from '../validations/lectures.validation.js';

export class LecturesRepository {
  /** 강의 생성 */
  async create(data: CreateLectureDto): Promise<Lecture> {
    const lectureData: {
      instructorId: string;
      title: string;
      subject?: string;
      description?: string;
      endAt?: Date;
    } = {
      instructorId: data.instructorId,
      title: data.title,
    };

    if (data.subject) {
      lectureData.subject = data.subject;
    }

    if (data.description) {
      lectureData.description = data.description;
    }

    if (data.endAt) {
      lectureData.endAt = new Date(data.endAt);
    }

    return await prisma.lecture.create({
      data: lectureData,
    });
  }

  /** ID로 강의 조회 */
  async findById(id: string): Promise<Lecture | null> {
    return await prisma.lecture.findUnique({
      where: { id },
    });
  }

  /** ID로 강사 조회 (존재 확인용) */
  async findInstructorById(instructorId: string): Promise<Instructor | null> {
    return await prisma.instructor.findUnique({
      where: {
        id: instructorId,
        deletedAt: null, // Soft delete 확인
      },
    });
  }

  /** 강의 리스트 조회 (커서 기반 페이지네이션) */
  async findMany(options: {
    cursor?: string;
    limit: number;
  }): Promise<Lecture[]> {
    const { cursor, limit } = options;
    console.log(cursor, limit);
    return await prisma.lecture.findMany({
      where: {
        deletedAt: null, // 삭제되지 않은 강의만 조회
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // nextCursor 판단을 위해 +1
      skip: cursor ? 1 : 0,
      ...(cursor && {
        // 커서 ID가 있을 때만 해당 항목을 건너뛰고 그 다음부터 가져옴
        cursor: {
          id: cursor,
        },
      }),
    });
  }

  /** ID로 강의 조회  */
  async findByIdWithRelations(id: string): Promise<Lecture | null> {
    return await prisma.lecture.findUnique({
      where: {
        id,
        deletedAt: null,
      },
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
      isActive: boolean;
    }>,
  ): Promise<Lecture> {
    return await prisma.lecture.update({
      where: {
        id,
        deletedAt: null,
      },
      data,
    });
  }

  /** 강의 soft delete */
  async softDelete(id: string): Promise<Lecture> {
    return await prisma.lecture.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
