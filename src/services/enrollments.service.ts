import { UserType } from '../constants/auth.constant.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { Prisma } from '../generated/prisma/client.js';

export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly lecturesRepository: LecturesRepository,
    private readonly assistantRepository: AssistantRepository,
  ) {}

  /** Enrollment 생성 */
  async createEnrollment(
    lectureId: string,
    data: Prisma.EnrollmentUncheckedCreateInput,
    userType: UserType,
    profileId: string,
  ) {
    if (userType !== UserType.INSTRUCTOR && userType !== UserType.ASSISTANT) {
      throw new ForbiddenException('수강 등록 권한이 없습니다.');
    }

    // 1. 강의 존재 여부 및 권한 확인
    const lecture = await this.lecturesRepository.findById(lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    // 2. 권한 체크 (강사 본인 또는 담당 조교)
    await this.checkLecturePermission(lecture, userType, profileId);

    // 3. 중복 등록 체크 (옵션, 필요한 경우 구현)
    // const existing = await ...

    // 4. Enrollment 생성
    return await this.enrollmentsRepository.create({
      ...data,
      lectureId,
      instructorId: lecture.instructorId, // 강의의 담당 강사로 설정
      status: 'ACTIVE',
    });
  }

  /** 강의별 수강생 목록 조회 */
  async getEnrollmentsByLectureId(
    lectureId: string,
    userType: UserType,
    profileId: string,
  ) {
    // 1. 강의 존재 및 권한 확인
    const lecture = await this.lecturesRepository.findById(lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    await this.checkLecturePermission(lecture, userType, profileId);

    return await this.enrollmentsRepository.findManyByLectureId(lectureId);
  }

  /** 강사(조교 포함)별 전체 수강생 목록 조회 */
  async getEnrollmentsByInstructor(userType: UserType, profileId: string) {
    let targetInstructorId = profileId;

    if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      targetInstructorId = assistant.instructorId;
    }

    return await this.enrollmentsRepository.findManyByInstructorId(
      targetInstructorId,
    );
  }

  /** Enrollment 상세 조회 (권한 체크 포함) */
  async getEnrollmentDetail(
    enrollmentId: string,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크
    if (userType === UserType.INSTRUCTOR) {
      if (enrollment.instructorId !== profileId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    } else if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      if (enrollment.instructorId !== assistant.instructorId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    } else {
      // 학생/학부모 등 기존 로직 유지 (기존 getEnrollmentById 활용 권장)
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return enrollment;
  }

  /** Enrollment 수정 */
  async updateEnrollment(
    id: string,
    data: Prisma.EnrollmentUpdateInput,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크 (간소화: 강사 본인 확인)
    if (userType === UserType.INSTRUCTOR) {
      if (enrollment.instructorId !== profileId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    } else if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      if (enrollment.instructorId !== assistant.instructorId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    }

    return await this.enrollmentsRepository.update(id, data);
  }

  /** Enrollment 삭제 (Soft Delete) */
  async deleteEnrollment(id: string, userType: UserType, profileId: string) {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크
    if (userType === UserType.INSTRUCTOR) {
      if (enrollment.instructorId !== profileId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    } else if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      if (enrollment.instructorId !== assistant.instructorId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
    }

    return await this.enrollmentsRepository.softDelete(id);
  }

  /** 기존 메서드 유지 (학생/학부모용) */
  async getEnrollments(userType: UserType, profileId: string) {
    let enrollments;

    if (userType === UserType.STUDENT) {
      enrollments =
        await this.enrollmentsRepository.findByAppStudentId(profileId);
    } else if (userType === UserType.PARENT) {
      enrollments =
        await this.enrollmentsRepository.findByAppParentId(profileId);
    } else {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return {
      enrollments,
    };
  }

  /** 기존 메서드 유지 (학생/학부모용 상세 조회) */
  async getEnrollmentById(
    enrollmentId: string,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment || enrollment.deletedAt) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    let hasPermission = false;

    if (userType === UserType.STUDENT) {
      hasPermission = enrollment.appStudentId === profileId;
    } else if (userType === UserType.PARENT) {
      hasPermission = enrollment.appParentLinkId
        ? await this.checkParentPermission(
            profileId,
            enrollment.appParentLinkId,
          )
        : false;
    }

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }

  /** -------- Helper Functions -------- */

  private async checkLecturePermission(
    lecture: { instructorId: string },
    userType: UserType,
    profileId: string,
  ) {
    if (userType === UserType.INSTRUCTOR) {
      if (lecture.instructorId !== profileId) {
        throw new ForbiddenException('본인의 강의만 관리할 수 있습니다.');
      }
    } else if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      if (lecture.instructorId !== assistant.instructorId) {
        throw new ForbiddenException('담당 강사의 강의만 관리할 수 있습니다.');
      }
    }
  }

  /** 학부모 권한 체크 */
  private async checkParentPermission(
    appParentId: string,
    appParentLinkId: string,
  ): Promise<boolean> {
    const link =
      await this.enrollmentsRepository.findParentIdByParentChildLinkId(
        appParentLinkId,
      );
    return link?.appParentId === appParentId;
  }
}
