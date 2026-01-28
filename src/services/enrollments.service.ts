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
import { GetEnrollmentsQueryDto } from '../validations/enrollments.validation.js';

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

    // [New] 2.5 학부모-자녀 링크 자동 확인 (전화번호 기반)
    // 수강 등록하려는 학생 번호로 등록된 자녀 링크들이 있는지 확인
    // (다수일 수도 있으나, 여기서는 가장 최근 혹은 특정 로직으로 하나를 잡거나,
    //  DB 스키마상 Enrollment가 특정 ParentChildLink 하나만 가리키므로,
    //  "이 학생 번호를 가진 ParentChildLink"가 여러 학부모에 의해 생성되었을 수 있음.
    //  요구사항: "해당하는 appParentLinkId 필드 자동 채우기" ->
    //  Enrollment는 1:N 이 아니라 N:1 (ParentChildLink) 관계가 아님.
    //  Schema: Enrollment -> appParentLinkId (Optional) -> ParentChildLink
    //  Enrollment 하나는 하나의 ParentChildLink만 가질 수 있음?
    //  Schema.prisma line 239: appParentLink ParentChildLink?
    //  근데 ParentChildLink는 (appParentId, phoneNumber) Unique임.
    //  만약 A학부모도 010-1234로 등록, B학부모도 010-1234로 등록했다면?
    //  Enrollment는 하나인데 어느 부모랑 연결해야 하나?
    //  보통 학원 로직상, 학생은 한 명이므로, 여러 학부모가 등록했다면
    //  Enrollment 모델이 `appParentLinkId` 하나만 가지는 구조는
    //  "이 수강생은 이 학부모의 자녀다"라고 특정하는 것임.
    //  하지만 실제로는 "엄마", "아빠" 둘 다 자녀 등록을 할 수 있음.
    //  현재 스키마: Enrollment has `appParentLinkId` (Scalar String?)
    //  schema.prisma line 226: appParentLinkId String?
    //  line 239: appParentLink ParentChildLink?
    //  이 구조면 Enrollment는 "단 하나의 ParentChildLink"하고만 연결됨.
    //  즉, 엄마가 등록해두면 아빠는 조회를 못함?
    //  요구사항: "각 자녀의 모든 강의 및 수강 프로필 전체 조회"
    //  학부모 입장에서: ChildLink -> phoneNumber -> Enrollments (by studentPhone)
    //  Enrollment table의 `appParentLinkId`는 "이 수강생이 어떤 Link를 통해 등록되었는지" 보다는
    //  "앱에서 어떤 학부모 계정과 연동되었는지"를 의미하는 듯.
    //  하지만 요구사항 3번: "자녀링크 id 이용하여 각 자녀의 모든 강의 및 수강 프로필 전체 조회"
    //  만약 Enrollment가 studentPhone만 가지고 있고,
    //  ParentChildLink가 studentPhone을 가지고 있다면,
    //  조회 시 Join을 `Enrollment.studentPhone == ParentChildLink.phoneNumber` 로 하는 게 맞지 않나?
    //  Repo `findByAppParentId` 구현을 보면:
    //  1. links = findMany(appParentId)
    //  2. findMany(enrollment where appParentLinkId IN links.id)
    //  이렇게 되어 있음. 즉, Enrollment의 `appParentLinkId`가 채워져 있어야만 조회됨.
    //  이러면 한 아이에 대해 엄마, 아빠 중 한 명만 볼 수 있는 구조임.
    //  (현재 스키마의 한계일 수 있으나, 일단 요구사항대로 구현해야 함)
    //
    //  자동 채우기 로직: phoneNumber와 일치하는 ParentChildLink가 있다면 찾아서 넣어줌.
    //  만약 여러 개(엄마, 아빠)라면?
    //  일단 하나라도 발견되면 넣어주는 식으로 구현 (일반적으로 먼저 등록한 사람 or 임의)
    //  혹은 요구사항이 "등록해둔 전화번호로... 링크 ID 필드 자동 채우기" 이므로.
    //  일단 첫 번째 발견된 Link로 연결.

    let parentLinkId = data.appParentLinkId;
    if (!parentLinkId && data.studentPhone) {
      const links = await this.parentChildLinkRepository.findManyByPhoneNumber(
        data.studentPhone,
      );
      if (links.length > 0) {
        // 여러 명이 등록했더라도 구조상 하나만 저장 가능하므로 첫 번째 것 사용
        // (추후 스키마 개선 제안 가능: Enrollment <-> ParentChildLink 1:N or M:N)
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
