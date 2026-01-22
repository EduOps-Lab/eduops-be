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
}
