import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { EnrollmentStatus } from '../constants/enrollments.constant.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { ParentChildLinkRepository } from '../repos/parent-child-link.repo.js';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  GetEnrollmentsQueryDto,
  GetSvcEnrollmentsQueryDto,
} from '../validations/enrollments.validation.js';

export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly lecturesRepository: LecturesRepository,
    private readonly assistantRepository: AssistantRepository,
    private readonly parentChildLinkRepository: ParentChildLinkRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /** Enrollment 생성 */
  async createEnrollment(
    lectureId: string,
    data: Prisma.EnrollmentUncheckedCreateInput,
    userType: UserType,
    profileId: string,
  ) {
    // 1. 강의 존재 여부 확인
    const lecture = await this.lecturesRepository.findById(lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    // 2. 권한 체크 (강사 본인 또는 담당 조교)
    await this.validateInstructorAccess(
      lecture.instructorId,
      userType,
      profileId,
    );

    let parentLinkId = data.appParentLinkId;
    if (!parentLinkId && data.studentPhone) {
      const links = await this.parentChildLinkRepository.findManyByPhoneNumber(
        data.studentPhone,
      );
      if (links.length > 0) {
        parentLinkId = links[0].id;
      }
    }

    // 3. Enrollment 생성
    return await this.enrollmentsRepository.create({
      ...data,
      lectureId,
      instructorId: lecture.instructorId, // 강의의 담당 강사로 설정
      status: EnrollmentStatus.ACTIVE,
      appParentLinkId: parentLinkId, // 자동 연결된 ID 설정
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

    await this.validateInstructorAccess(
      lecture.instructorId,
      userType,
      profileId,
    );

    return await this.enrollmentsRepository.findManyByLectureId(lectureId);
  }

  /** 강사(조교 포함)별 전체 수강생 목록 조회 */
  async getEnrollmentsByInstructor(
    userType: UserType,
    profileId: string,
    query: GetEnrollmentsQueryDto,
  ) {
    const targetInstructorId = await this.getEffectiveInstructorId(
      userType,
      profileId,
    );

    return await this.enrollmentsRepository.findManyByInstructorId(
      targetInstructorId,
      query,
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
    await this.validateInstructorAccess(
      enrollment.instructorId,
      userType,
      profileId,
    );

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

    // 권한 체크
    await this.validateInstructorAccess(
      enrollment.instructorId,
      userType,
      profileId,
    );

    return await this.enrollmentsRepository.update(id, data);
  }

  /** Enrollment 삭제 (Soft Delete) */
  async deleteEnrollment(id: string, userType: UserType, profileId: string) {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크
    await this.validateInstructorAccess(
      enrollment.instructorId,
      userType,
      profileId,
    );

    return await this.enrollmentsRepository.softDelete(id);
  }

  /** 기존 메서드 유지 (학생/학부모용) */
  async getEnrollments(
    userType: UserType,
    profileId: string,
    query?: GetSvcEnrollmentsQueryDto,
  ) {
    let enrollments;
    let totalCount = 0;

    if (userType === UserType.STUDENT) {
      const result = await this.enrollmentsRepository.findByAppStudentId(
        profileId,
        query,
      );
      enrollments = result.enrollments;
      totalCount = result.totalCount;
    } else if (userType === UserType.PARENT) {
      // 학부모의 경우 모든 자녀의 수강 목록 조회 (현재는 페이지네이션 미적용)
      enrollments =
        await this.enrollmentsRepository.findByAppParentId(profileId);
      totalCount = enrollments.length;
    } else {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return {
      enrollments,
      totalCount,
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

  /** 강사 및 조교 권한 체크 */
  private async validateInstructorAccess(
    instructorId: string,
    userType: UserType,
    profileId: string,
  ) {
    const effectiveInstructorId = await this.getEffectiveInstructorId(
      userType,
      profileId,
    );
    if (instructorId !== effectiveInstructorId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
  }

  /** 실제 권한을 가진 강사 ID 추출 (DI 기반 리졸버) */
  private async getEffectiveInstructorId(
    userType: UserType,
    profileId: string,
  ): Promise<string> {
    if (userType === UserType.INSTRUCTOR) {
      return profileId;
    }

    if (userType === UserType.ASSISTANT) {
      const assistant = await this.assistantRepository.findById(profileId);
      if (!assistant) {
        throw new NotFoundException('조교 정보를 찾을 수 없습니다.');
      }
      return assistant.instructorId;
    }

    throw new ForbiddenException('접근 권한이 없습니다.');
  }

  /** 강의별 권한 체크 (getEffectiveInstructorId 활용) */
  private async checkLecturePermission(
    lecture: { instructorId: string },
    userType: UserType,
    profileId: string,
  ) {
    const effectiveInstructorId = await this.getEffectiveInstructorId(
      userType,
      profileId,
    );
    if (lecture.instructorId !== effectiveInstructorId) {
      throw new ForbiddenException('해당 권한이 없습니다.');
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
