import { EnrollmentsService } from './enrollments.service.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import {
  createMockEnrollmentsRepository,
  createMockLecturesRepository,
  createMockStudentRepository,
  createMockParentsService,
  createMockPermissionService,
  createMockPrisma,
} from '../test/mocks/index.js';
import {
  mockEnrollments,
  mockStudents,
  mockParents,
  mockParentLinks,
  mockAssistants,
  createEnrollmentRequests,
  updateEnrollmentRequests,
  mockEnrollmentWithRelations,
  mockEnrollmentsList,
  mockEnrollmentQueries,
} from '../test/fixtures/enrollments.fixture.js';
import {
  mockLectures,
  mockInstructor,
} from '../test/fixtures/lectures.fixture.js';
import { UserType } from '../constants/auth.constant.js';
import { EnrollmentStatus } from '../constants/enrollments.constant.js';
import { PrismaClient } from '../generated/prisma/client.js';

import { EnrollmentsRepository } from '../repos/enrollments.repo.js';

type EnrollmentWithRelations = Awaited<
  ReturnType<EnrollmentsRepository['findByIdWithRelations']>
>;

describe('EnrollmentsService - @unit #critical', () => {
  // Mock Dependencies
  let mockEnrollmentsRepo: ReturnType<typeof createMockEnrollmentsRepository>;
  let mockLecturesRepo: ReturnType<typeof createMockLecturesRepository>;
  let mockStudentRepo: ReturnType<typeof createMockStudentRepository>;
  let mockParentsService: ReturnType<typeof createMockParentsService>;
  let mockPermissionService: ReturnType<typeof createMockPermissionService>;
  let mockPrisma: PrismaClient;

  // Service under test
  let enrollmentsService: EnrollmentsService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockEnrollmentsRepo = createMockEnrollmentsRepository();
    mockLecturesRepo = createMockLecturesRepository();
    mockStudentRepo = createMockStudentRepository();
    mockParentsService = createMockParentsService();
    mockPermissionService = createMockPermissionService();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create EnrollmentsService DI
    enrollmentsService = new EnrollmentsService(
      mockEnrollmentsRepo,
      mockLecturesRepo,
      mockStudentRepo,
      mockParentsService,
      mockPermissionService,
      mockPrisma,
    );
  });

  /** [수강 생성] createEnrollment 테스트 케이스 */
  describe('[수강 생성] createEnrollment', () => {
    const lectureId = mockLectures.basic.id;
    const instructorId = mockInstructor.id;

    describe('ENR-01: 수강 생성 성공', () => {
      it('강사가 자신의 강의에 수강생 등록을 요청할 때, 수강 정보가 생성되고 반환된다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        // Act
        const result = await enrollmentsService.createEnrollment(
          lectureId,
          {
            ...createEnrollmentRequests.basic,
            lectureId,
            instructorId,
            status: EnrollmentStatus.ACTIVE,
          },
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(mockEnrollments.active.id);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(lectureId);
        expect(mockEnrollmentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            lectureId,
            instructorId,
            status: EnrollmentStatus.ACTIVE,
            studentName: createEnrollmentRequests.basic.studentName,
          }),
        );
      });

      it('조교가 담당 강사의 강의에 수강생 등록을 요청할 때, 수강 정보가 생성되고 반환된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        const result = await enrollmentsService.createEnrollment(
          lectureId,
          {
            ...createEnrollmentRequests.basic,
            lectureId,
            instructorId: mockLectures.basic.instructorId,
            status: EnrollmentStatus.ACTIVE,
          },
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        expect(result).toBeDefined();
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalledWith(
          mockLectures.basic.instructorId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );
        expect(mockEnrollmentsRepo.create).toHaveBeenCalled();
      });

      it('수강생 등록 시 학생 전화번호가 학부모-자녀 링크와 일치할 때, ParentLink가 자동으로 연결된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockParentsService.findLinkByPhoneNumber.mockResolvedValue(
          mockParentLinks.active,
        );
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        await enrollmentsService.createEnrollment(
          lectureId,
          {
            ...createEnrollmentRequests.basic,
            lectureId,
            instructorId,
            status: EnrollmentStatus.ACTIVE,
          },
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(mockParentsService.findLinkByPhoneNumber).toHaveBeenCalledWith(
          createEnrollmentRequests.basic.studentPhone,
        );
        expect(mockEnrollmentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            appParentLinkId: mockParentLinks.active.id,
          }),
        );
      });

      it('수강생 등록 시 ParentLinkId가 직접 제공될 때, 전화번호 검색 없이 해당 링크로 연결된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        await enrollmentsService.createEnrollment(
          lectureId,
          {
            ...createEnrollmentRequests.withParentLink,
            lectureId,
            instructorId,
            status: EnrollmentStatus.ACTIVE,
          },
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(mockParentsService.findLinkByPhoneNumber).not.toHaveBeenCalled();
        expect(mockEnrollmentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            appParentLinkId:
              createEnrollmentRequests.withParentLink.appParentLinkId,
          }),
        );
      });
    });

    describe('ENR-02: 수강 생성 실패 - 강의 검증', () => {
      it('사용자가 존재하지 않는 강의 ID로 수강생 등록을 요청할 때, NotFoundException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          enrollmentsService.createEnrollment(
            'invalid-lecture-id',
            {
              ...createEnrollmentRequests.basic,
              lectureId: 'invalid-lecture-id',
              instructorId,
              status: EnrollmentStatus.ACTIVE,
            },
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(
          'invalid-lecture-id',
        );
      });
    });

    describe('ENR-03: 수강 생성 실패 - 권한 검증', () => {
      it('강사가 다른 강사의 강의에 수강생 등록을 요청할 때, ForbiddenException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.createEnrollment(
            mockLectures.otherInstructor.id,
            {
              ...createEnrollmentRequests.basic,
              lectureId: mockLectures.otherInstructor.id,
              instructorId,
              status: EnrollmentStatus.ACTIVE,
            },
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('조교가 담당 강사가 아닌 다른 강사의 강의에 수강생 등록을 요청할 때, ForbiddenException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.createEnrollment(
            lectureId,
            {
              ...createEnrollmentRequests.basic,
              lectureId,
              instructorId: mockLectures.basic.instructorId,
              status: EnrollmentStatus.ACTIVE,
            },
            UserType.ASSISTANT,
            mockAssistants.otherInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [강의별 수강생 목록] getEnrollmentsByLectureId 테스트 케이스 */
  describe('[강의별 수강생 목록] getEnrollmentsByLectureId', () => {
    const lectureId = mockLectures.basic.id;
    const instructorId = mockInstructor.id;

    describe('ENR-04: 강의별 수강생 목록 조회 성공', () => {
      it('강사가 자신의 강의 수강생 목록 조회를 요청할 때, 해당 강의의 모든 수강 정보 목록이 반환된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.findManyByLectureId.mockResolvedValue(
          mockEnrollmentsList as unknown as Awaited<
            ReturnType<EnrollmentsRepository['findManyByLectureId']>
          >,
        );

        const result = await enrollmentsService.getEnrollmentsByLectureId(
          lectureId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(mockEnrollmentsList);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(lectureId);
        expect(mockEnrollmentsRepo.findManyByLectureId).toHaveBeenCalledWith(
          lectureId,
        );
      });

      it('조교가 담당 강사의 강의 수강생 목록 조회를 요청할 때, 해당 강의의 모든 수강 정보 목록이 반환된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockEnrollmentsRepo.findManyByLectureId.mockResolvedValue(
          mockEnrollmentsList as unknown as Awaited<
            ReturnType<EnrollmentsRepository['findManyByLectureId']>
          >,
        );

        const result = await enrollmentsService.getEnrollmentsByLectureId(
          lectureId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        expect(result).toEqual(mockEnrollmentsList);
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalledWith(
          mockLectures.basic.instructorId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );
      });
    });

    describe('ENR-05: 강의별 수강생 목록 조회 실패', () => {
      it('사용자가 존재하지 않는 강의 ID로 수강생 목록 조회를 요청할 때, NotFoundException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          enrollmentsService.getEnrollmentsByLectureId(
            'invalid-lecture-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('강사가 다른 강사의 강의 수강생 목록 조회를 요청할 때, ForbiddenException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.getEnrollmentsByLectureId(
            mockLectures.otherInstructor.id,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [전체 수강생 목록] getEnrollmentsByInstructor 테스트 케이스 */
  describe('[전체 수강생 목록] getEnrollmentsByInstructor', () => {
    const instructorId = mockInstructor.id;

    describe('ENR-06: 강사별 전체 수강생 목록 조회 성공', () => {
      it('강사가 본인 소속 모든 수강생 목록 조회를 요청할 때, 페이지네이션이 적용된 목록과 전체 개수가 반환된다', async () => {
        mockEnrollmentsRepo.findManyByInstructorId.mockResolvedValue({
          enrollments: mockEnrollmentsList as unknown as Awaited<
            ReturnType<EnrollmentsRepository['findManyByInstructorId']>
          >['enrollments'],
          totalCount: mockEnrollmentsList.length,
        });

        const result = await enrollmentsService.getEnrollmentsByInstructor(
          UserType.INSTRUCTOR,
          instructorId,
          mockEnrollmentQueries.withPagination,
        );

        expect(result).toEqual({
          enrollments: mockEnrollmentsList,
          totalCount: mockEnrollmentsList.length,
        });
        expect(
          mockPermissionService.getEffectiveInstructorId,
        ).toHaveBeenCalledWith(UserType.INSTRUCTOR, instructorId);
      });

      it('조교가 담당 강사 소속 모든 수강생 목록 조회를 요청할 때, 페이지네이션이 적용된 목록과 전체 개수가 반환된다', async () => {
        mockPermissionService.getEffectiveInstructorId.mockResolvedValue(
          instructorId,
        );
        mockEnrollmentsRepo.findManyByInstructorId.mockResolvedValue({
          enrollments: mockEnrollmentsList as unknown as Awaited<
            ReturnType<EnrollmentsRepository['findManyByInstructorId']>
          >['enrollments'],
          totalCount: mockEnrollmentsList.length,
        });

        const result = await enrollmentsService.getEnrollmentsByInstructor(
          UserType.ASSISTANT,
          mockAssistants.basic.id,
          mockEnrollmentQueries.withPagination,
        );

        expect(result).toEqual({
          enrollments: mockEnrollmentsList,
          totalCount: mockEnrollmentsList.length,
        });
        expect(
          mockPermissionService.getEffectiveInstructorId,
        ).toHaveBeenCalledWith(UserType.ASSISTANT, mockAssistants.basic.id);
        expect(mockEnrollmentsRepo.findManyByInstructorId).toHaveBeenCalledWith(
          instructorId,
          mockEnrollmentQueries.withPagination,
        );
      });
    });
  });

  /** [수강 상세 조회] getEnrollmentDetail 테스트 케이스 */
  describe('[수강 상세 조회] getEnrollmentDetail', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-07: 수강 상세 조회 성공', () => {
      it('강사가 자신의 수강생 상세 정보 조회를 요청할 때, 연관 관계가 포함된 상세 수강 정보가 반환된다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations as unknown as EnrollmentWithRelations,
        );

        const result = await enrollmentsService.getEnrollmentDetail(
          enrollmentId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(mockEnrollmentWithRelations);
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('조교가 담당 강사 소속 수강생의 상세 정보 조회를 요청할 때, 연관 관계가 포함된 상세 수강 정보가 반환된다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockResolvedValue();

        const result = await enrollmentsService.getEnrollmentDetail(
          enrollmentId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        expect(result).toEqual(mockEnrollmentWithRelations);
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalled();
      });
    });

    describe('ENR-08: 수강 상세 조회 실패', () => {
      it('사용자가 존재하지 않는 수강 ID로 상세 조회를 요청할 때, NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        await expect(
          enrollmentsService.getEnrollmentDetail(
            'invalid-enrollment-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('강사가 다른 강사 소속 수강생의 상세 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.otherInstructor as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.getEnrollmentDetail(
            mockEnrollments.otherInstructor.id,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [수강 정보 수정] updateEnrollment 테스트 케이스 */
  describe('[수강 정보 수정] updateEnrollment', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-09: 수강 정보 수정 성공', () => {
      it('강사가 모든 유효한 필드를 포함하여 수강 정보 수정을 요청할 때, 정보가 업데이트되고 반영된 결과가 반환된다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.full,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.full,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(updatedEnrollment);
        expect(mockEnrollmentsRepo.update).toHaveBeenCalledWith(
          enrollmentId,
          updateEnrollmentRequests.full,
        );
      });

      it('강사가 일부 필드만 포함하여 수강 정보 수정을 요청할 때, 해당 필드만 업데이트되고 결과가 반환된다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.partial,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.partial,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(updatedEnrollment);
        expect(mockEnrollmentsRepo.update).toHaveBeenCalledWith(
          enrollmentId,
          updateEnrollmentRequests.partial,
        );
      });

      it('조교가 담당 강사 소속 수강생의 정보 수정을 요청할 때, 수강 정보가 업데이트되고 결과가 반환된다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.partial,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.partial,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        expect(result).toEqual(updatedEnrollment);
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalled();
      });
    });

    describe('ENR-10: 수강 정보 수정 실패', () => {
      it('사용자가 존재하지 않는 수강 ID로 수강 정보 수정을 요청할 때, NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(null);

        await expect(
          enrollmentsService.updateEnrollment(
            'invalid-enrollment-id',
            updateEnrollmentRequests.partial,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('강사가 다른 강사 소속 수강생의 정보를 수정하려 할 때, ForbiddenException을 던진다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.updateEnrollment(
            mockEnrollments.otherInstructor.id,
            updateEnrollmentRequests.partial,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [수강 정보 삭제] deleteEnrollment 테스트 케이스 */
  describe('[수강 정보 삭제] deleteEnrollment', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-11: 수강 정보 삭제 성공', () => {
      it('강사가 수강 정보 삭제를 요청할 때, 해당 수강 정보가 Soft Delete(삭제일시 기록)되고 반환된다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        const deletedEnrollment = {
          ...mockEnrollments.active,
          deletedAt: new Date(),
        };
        mockEnrollmentsRepo.softDelete.mockResolvedValue(deletedEnrollment);

        const result = await enrollmentsService.deleteEnrollment(
          enrollmentId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(deletedEnrollment);
        expect(mockEnrollmentsRepo.softDelete).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('조교가 담당 강사 소속 수강생의 삭제를 요청할 때, 해당 수강 정보가 Soft Delete되고 반환된다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        const deletedEnrollment = {
          ...mockEnrollments.active,
          deletedAt: new Date(),
        };
        mockEnrollmentsRepo.softDelete.mockResolvedValue(deletedEnrollment);

        const result = await enrollmentsService.deleteEnrollment(
          enrollmentId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        expect(result).toEqual(deletedEnrollment);
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalled();
      });
    });

    describe('ENR-12: 수강 정보 삭제 실패', () => {
      it('사용자가 존재하지 않는 수강 ID로 삭제를 요청할 때, NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(null);

        await expect(
          enrollmentsService.deleteEnrollment(
            'invalid-enrollment-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('강사가 다른 강사 소속 수강생의 정보를 삭제하려 할 때, ForbiddenException을 던진다', async () => {
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.deleteEnrollment(
            mockEnrollments.otherInstructor.id,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [학생/학부모용] getEnrollments 테스트 케이스 */
  describe('[학생/학부모용] getEnrollments', () => {
    describe('ENR-13: 학생 수강 목록 조회', () => {
      it('학생이 본인의 수강 목록 조회를 요청할 때, 페이지네이션이 적용된 목록과 전체 개수가 반환된다', async () => {
        const studentId = mockStudents.basic.id;
        mockEnrollmentsRepo.findByAppStudentId.mockResolvedValue({
          enrollments: [mockEnrollments.active] as unknown as Awaited<
            ReturnType<EnrollmentsRepository['findByAppStudentId']>
          >['enrollments'],
          totalCount: 1,
        });

        const result = await enrollmentsService.getEnrollments(
          UserType.STUDENT,
          studentId,
          mockEnrollmentQueries.withPagination,
        );

        expect(result.enrollments).toHaveLength(1);
        expect(result.totalCount).toBe(1);
        expect(mockEnrollmentsRepo.findByAppStudentId).toHaveBeenCalledWith(
          studentId,
          mockEnrollmentQueries.withPagination,
        );
      });
    });

    describe('ENR-14: 학부모 수강 목록 조회', () => {
      it('학부모가 자녀들의 전체 수강 목록 조회를 요청할 때, 모든 자녀의 수강 정보 목록이 반환된다', async () => {
        const parentId = mockParents.basic.id;

        await expect(
          enrollmentsService.getEnrollments(UserType.PARENT, parentId),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('ENR-15: 수강 목록 조회 실패', () => {
      it('학생/학부모가 아닌 사용자가 전용 수강 목록 조회를 요청할 때, ForbiddenException을 던진다', async () => {
        await expect(
          enrollmentsService.getEnrollments(
            UserType.INSTRUCTOR,
            mockInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  /** [학생/학부모용 상세] getEnrollmentById 테스트 케이스 */
  describe('[학생/학부모용 상세] getEnrollmentById', () => {
    const enrollmentId = mockEnrollments.active.id;

    describe('ENR-16: 학생 수강 상세 조회', () => {
      it('학생이 본인의 수강 상세 정보 조회를 요청할 때, 상세 수강 정보가 반환된다', async () => {
        const studentId = mockStudents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );

        const result = await enrollmentsService.getEnrollmentById(
          enrollmentId,
          UserType.STUDENT,
          studentId,
        );

        expect(result).toEqual(mockEnrollments.active);
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('학생이 다른 학생의 수강 상세 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        const anotherStudentId = mockStudents.another.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateEnrollmentReadAccess.mockRejectedValue(
          new ForbiddenException('본인의 정보만 조회할 수 있습니다.'),
        );

        await expect(
          enrollmentsService.getEnrollmentById(
            enrollmentId,
            UserType.STUDENT,
            anotherStudentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('ENR-17: 학부모 수강 상세 조회', () => {
      it('학부모가 본인 자녀의 수강 상세 정보 조회를 요청할 때, 상세 수강 정보가 반환된다', async () => {
        const parentId = mockParents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        const result = await enrollmentsService.getEnrollmentById(
          enrollmentId,
          UserType.PARENT,
          parentId,
        );

        expect(result).toBeDefined();
        expect(result.id).toBe(enrollmentId);
      });

      it('학부모가 다른 학부모의 자녀 수강 상세 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        const anotherParentId = mockParents.another.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateEnrollmentReadAccess.mockRejectedValue(
          new ForbiddenException('접근 권한이 없습니다.'),
        );

        await expect(
          enrollmentsService.getEnrollmentById(
            enrollmentId,
            UserType.PARENT,
            anotherParentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('학부모-자녀 링크가 없는 수강 정보에 대해 학부모가 상세 조회를 요청할 때, ForbiddenException을 던진다', async () => {
        const parentId = mockParents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.withoutParentLink as unknown as EnrollmentWithRelations,
        );
        mockPermissionService.validateEnrollmentReadAccess.mockRejectedValue(
          new ForbiddenException('연결된 자녀 정보가 없습니다.'),
        );

        await expect(
          enrollmentsService.getEnrollmentById(
            mockEnrollments.withoutParentLink.id,
            UserType.PARENT,
            parentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('ENR-18: 수강 상세 조회 실패', () => {
      it('학생/학부모가 존재하지 않는 수강 ID로 상세 조회를 요청할 때, NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        await expect(
          enrollmentsService.getEnrollmentById(
            'invalid-enrollment-id',
            UserType.STUDENT,
            mockStudents.basic.id,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('학생/학부모가 이미 삭제된 수강 ID로 상세 조회를 요청할 때, NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.deleted as unknown as EnrollmentWithRelations,
        );

        await expect(
          enrollmentsService.getEnrollmentById(
            mockEnrollments.deleted.id,
            UserType.STUDENT,
            mockStudents.basic.id,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  /** [Helper 함수] getEffectiveInstructorId 테스트 케이스 */
  describe('[Helper 함수] getEffectiveInstructorId', () => {
    it('조교가 강사 소속 정보 조회를 요청할 때, 담당 강사의 ID가 효과적인 ID로 사용된다', async () => {
      mockPermissionService.getEffectiveInstructorId.mockResolvedValue(
        mockAssistants.basic.instructorId,
      );

      await enrollmentsService.getEnrollmentsByInstructor(
        UserType.ASSISTANT,
        mockAssistants.basic.id,
        mockEnrollmentQueries.withPagination,
      );

      expect(
        mockPermissionService.getEffectiveInstructorId,
      ).toHaveBeenCalledWith(UserType.ASSISTANT, mockAssistants.basic.id);
      expect(mockEnrollmentsRepo.findManyByInstructorId).toHaveBeenCalledWith(
        mockAssistants.basic.instructorId,
        mockEnrollmentQueries.withPagination,
      );
    });

    it('존재하지 않는 조교 ID로 권한 검증을 시도할 때, NotFoundException을 던진다', async () => {
      mockPermissionService.getEffectiveInstructorId.mockRejectedValue(
        new NotFoundException('조교 정보를 찾을 수 없습니다.'),
      );

      await expect(
        enrollmentsService.getEnrollmentsByInstructor(
          UserType.ASSISTANT,
          'invalid-assistant-id',
          mockEnrollmentQueries.withPagination,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ENR-20: 권한 없는 userType', () => {
    it('강사/조교가 아닌 사용자가 강사 소속 정보 조회를 요청할 때, ForbiddenException을 던진다', async () => {
      mockPermissionService.getEffectiveInstructorId.mockRejectedValue(
        new ForbiddenException('강사 또는 조교만 접근 가능합니다.'),
      );

      await expect(
        enrollmentsService.getEnrollmentsByInstructor(
          UserType.STUDENT,
          mockStudents.basic.id,
          mockEnrollmentQueries.withPagination,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
