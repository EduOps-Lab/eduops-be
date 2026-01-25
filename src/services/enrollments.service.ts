import { UserType } from '../constants/auth.constant.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';

export class EnrollmentsService {
  constructor(private readonly enrollmentsRepository: EnrollmentsRepository) {}

  /** 수강 목록 조회 */
  async getEnrollments(userType: UserType, profileId: string) {
    let enrollments;

    /**  userType에 따라 수강 목록 조회*/
    if (userType === UserType.STUDENT) {
      //  appStudentId로 조회
      enrollments =
        await this.enrollmentsRepository.findByAppStudentId(profileId);
    } else if (userType === UserType.PARENT) {
      // appParentId로 ParentChildLink 을 찾고 각 link의 ID로 enrollments 조회 후 병합
      enrollments =
        await this.enrollmentsRepository.findByAppParentLinkId(profileId);
    } else {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return {
      enrollments,
    };
  }

  /** Enrollment 상세 조회 */
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

    /** userType에 따른 권한 체크 */
    let hasPermission = false;

    if (userType === UserType.STUDENT) {
      hasPermission = enrollment.appStudentId === profileId;
    } else if (userType === UserType.PARENT) {
      // 학부모인 경우 ParentChildLink를 통해 확인
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
