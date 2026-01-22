import { Lecture } from '../generated/prisma/client.js';
import { NotFoundException } from '../err/http.exception.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { CreateLectureDto } from '../validations/lectures.validation.js';

export class LecturesService {
  private lecturesRepository: LecturesRepository;

  constructor() {
    this.lecturesRepository = new LecturesRepository();
  }

  /** 강의 생성 */
  async createLecture(data: CreateLectureDto): Promise<Lecture> {
    const instructor = await this.lecturesRepository.findInstructorById(
      data.instructorId,
    );

    if (!instructor) {
      throw new NotFoundException(
        `강사를 찾을 수 없습니다. (ID: ${data.instructorId})`,
      );
    }

    const lecture = await this.lecturesRepository.create(data);

    return lecture;
  }
}
