/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { EnrollmentsService } from './enrollments.service.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import {
  createMockEnrollmentsRepository,
  createMockLecturesRepository,
  createMockAssistantRepository,
  createMockParentChildLinkRepository,
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

describe('EnrollmentsService', () => {
  // Mock Dependencies
  let mockEnrollmentsRepo: ReturnType<typeof createMockEnrollmentsRepository>;
  let mockLecturesRepo: ReturnType<typeof createMockLecturesRepository>;
  let mockAssistantRepo: ReturnType<typeof createMockAssistantRepository>;
  let mockParentChildLinkRepo: ReturnType<
    typeof createMockParentChildLinkRepository
  >;
  let mockPrisma: PrismaClient;

  // Service under test
  let enrollmentsService: EnrollmentsService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockEnrollmentsRepo = createMockEnrollmentsRepository();
    mockLecturesRepo = createMockLecturesRepository();
    mockAssistantRepo = createMockAssistantRepository();
    mockParentChildLinkRepo = createMockParentChildLinkRepository();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create EnrollmentsService DI
    enrollmentsService = new EnrollmentsService(
      mockEnrollmentsRepo,
      mockLecturesRepo,
      mockAssistantRepo,
      mockParentChildLinkRepo,
      mockPrisma,
    );
  });

  // ============================================
  // [수강 생성] createEnrollment 테스트 케이스
  // ============================================
  describe('[수강 생성] createEnrollment', () => {
    const lectureId = mockLectures.basic.id;
    const instructorId = mockInstructor.id;

    describe('ENR-01: 수강 생성 성공', () => {
      it('강사가 자신의 강의에 수강생을 등록할 수 있다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockParentChildLinkRepo.findManyByPhoneNumber.mockResolvedValue([]);
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        // Act
        const result = await enrollmentsService.createEnrollment(
          lectureId,
          createEnrollmentRequests.basic as any,
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

      it('조교가 담당 강사의 강의에 수강생을 등록할 수 있다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        mockParentChildLinkRepo.findManyByPhoneNumber.mockResolvedValue([]);
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        // Act
        const result = await enrollmentsService.createEnrollment(
          lectureId,
          createEnrollmentRequests.basic as any,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        // Assert
        expect(result).toBeDefined();
        expect(mockAssistantRepo.findById).toHaveBeenCalledWith(
          mockAssistants.basic.id,
        );
        expect(mockEnrollmentsRepo.create).toHaveBeenCalled();
      });

      it('학생 전화번호로 ParentLink를 자동으로 연결한다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockParentChildLinkRepo.findManyByPhoneNumber.mockResolvedValue([
          mockParentLinks.active,
        ]);
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        // Act
        await enrollmentsService.createEnrollment(
          lectureId,
          createEnrollmentRequests.basic as any,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(
          mockParentChildLinkRepo.findManyByPhoneNumber,
        ).toHaveBeenCalledWith(createEnrollmentRequests.basic.studentPhone);
        expect(mockEnrollmentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            appParentLinkId: mockParentLinks.active.id,
          }),
        );
      });

      it('appParentLinkId가 이미 제공된 경우 전화번호 검색을 하지 않는다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.create.mockResolvedValue(mockEnrollments.active);

        // Act
        await enrollmentsService.createEnrollment(
          lectureId,
          createEnrollmentRequests.withParentLink,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(
          mockParentChildLinkRepo.findManyByPhoneNumber,
        ).not.toHaveBeenCalled();
        expect(mockEnrollmentsRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            appParentLinkId:
              createEnrollmentRequests.withParentLink.appParentLinkId,
          }),
        );
      });
    });

    describe('ENR-02: 수강 생성 실패 - 강의 검증', () => {
      it('존재하지 않는 강의에 수강생을 등록하려 하면 NotFoundException을 던진다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.createEnrollment(
            'invalid-lecture-id',
            createEnrollmentRequests.basic as any,
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
      it('다른 강사의 강의에 수강생을 등록하려 하면 ForbiddenException을 던진다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );

        // Act & Assert
        await expect(
          enrollmentsService.createEnrollment(
            mockLectures.otherInstructor.id,
            createEnrollmentRequests.basic,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('다른 강사 소속 조교가 수강생을 등록하려 하면 ForbiddenException을 던진다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockAssistantRepo.findById.mockResolvedValue(
          mockAssistants.otherInstructor,
        );

        // Act & Assert
        await expect(
          enrollmentsService.createEnrollment(
            lectureId,
            createEnrollmentRequests.basic as any,
            UserType.ASSISTANT,
            mockAssistants.otherInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  // ============================================
  // [강의별 수강생 목록] getEnrollmentsByLectureId 테스트 케이스
  // ============================================
  describe('[강의별 수강생 목록] getEnrollmentsByLectureId', () => {
    const lectureId = mockLectures.basic.id;
    const instructorId = mockInstructor.id;

    describe('ENR-04: 강의별 수강생 목록 조회 성공', () => {
      it('강사가 자신의 강의 수강생 목록을 조회할 수 있다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.findManyByLectureId.mockResolvedValue(
          mockEnrollmentsList,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentsByLectureId(
          lectureId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentsList);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(lectureId);
        expect(mockEnrollmentsRepo.findManyByLectureId).toHaveBeenCalledWith(
          lectureId,
        );
      });

      it('조교가 담당 강사의 강의 수강생 목록을 조회할 수 있다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        mockEnrollmentsRepo.findManyByLectureId.mockResolvedValue(
          mockEnrollmentsList,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentsByLectureId(
          lectureId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentsList);
        expect(mockAssistantRepo.findById).toHaveBeenCalledWith(
          mockAssistants.basic.id,
        );
      });
    });

    describe('ENR-05: 강의별 수강생 목록 조회 실패', () => {
      it('존재하지 않는 강의 조회 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.getEnrollmentsByLectureId(
            'invalid-lecture-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('다른 강사의 강의 조회 시 ForbiddenException을 던진다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );

        // Act & Assert
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

  // ============================================
  // [전체 수강생 목록] getEnrollmentsByInstructor 테스트 케이스
  // ============================================
  describe('[전체 수강생 목록] getEnrollmentsByInstructor', () => {
    const instructorId = mockInstructor.id;

    describe('ENR-06: 강사별 전체 수강생 목록 조회 성공', () => {
      it('강사가 자신의 모든 수강생을 조회할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findManyByInstructorId.mockResolvedValue(
          mockEnrollmentsList,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentsByInstructor(
          UserType.INSTRUCTOR,
          instructorId,
          mockEnrollmentQueries.withPagination,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentsList);
        expect(mockEnrollmentsRepo.findManyByInstructorId).toHaveBeenCalledWith(
          instructorId,
          mockEnrollmentQueries.withPagination,
        );
      });

      it('조교가 담당 강사의 모든 수강생을 조회할 수 있다', async () => {
        // Arrange
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        mockEnrollmentsRepo.findManyByInstructorId.mockResolvedValue(
          mockEnrollmentsList,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentsByInstructor(
          UserType.ASSISTANT,
          mockAssistants.basic.id,
          mockEnrollmentQueries.withPagination,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentsList);
        expect(mockAssistantRepo.findById).toHaveBeenCalledWith(
          mockAssistants.basic.id,
        );
        expect(mockEnrollmentsRepo.findManyByInstructorId).toHaveBeenCalledWith(
          instructorId,
          mockEnrollmentQueries.withPagination,
        );
      });
    });
  });

  // ============================================
  // [수강 상세 조회] getEnrollmentDetail 테스트 케이스
  // ============================================
  describe('[수강 상세 조회] getEnrollmentDetail', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-07: 수강 상세 조회 성공', () => {
      it('강사가 자신의 수강생 상세 정보를 조회할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentDetail(
          enrollmentId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentWithRelations);
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('조교가 담당 강사의 수강생 상세 정보를 조회할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);

        // Act
        const result = await enrollmentsService.getEnrollmentDetail(
          enrollmentId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        // Assert
        expect(result).toEqual(mockEnrollmentWithRelations);
      });
    });

    describe('ENR-08: 수강 상세 조회 실패', () => {
      it('존재하지 않는 수강 정보 조회 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.getEnrollmentDetail(
            'invalid-enrollment-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('다른 강사의 수강생 조회 시 ForbiddenException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.otherInstructor as any,
        );

        // Act & Assert
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

  // ============================================
  // [수강 정보 수정] updateEnrollment 테스트 케이스
  // ============================================
  describe('[수강 정보 수정] updateEnrollment', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-09: 수강 정보 수정 성공', () => {
      it('강사가 수강 정보를 전체 수정할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as any,
        );
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.full,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        // Act
        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.full,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toEqual(updatedEnrollment);
        expect(mockEnrollmentsRepo.update).toHaveBeenCalledWith(
          enrollmentId,
          updateEnrollmentRequests.full,
        );
      });

      it('강사가 수강 정보를 부분 수정할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as any,
        );
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.partial,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        // Act
        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.partial,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toEqual(updatedEnrollment);
        expect(mockEnrollmentsRepo.update).toHaveBeenCalledWith(
          enrollmentId,
          updateEnrollmentRequests.partial,
        );
      });

      it('조교가 담당 강사의 수강생 정보를 수정할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as any,
        );
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        const updatedEnrollment = {
          ...mockEnrollments.active,
          ...updateEnrollmentRequests.partial,
        };
        mockEnrollmentsRepo.update.mockResolvedValue(updatedEnrollment);

        // Act
        const result = await enrollmentsService.updateEnrollment(
          enrollmentId,
          updateEnrollmentRequests.partial,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        // Assert
        expect(result).toEqual(updatedEnrollment);
        expect(mockAssistantRepo.findById).toHaveBeenCalled();
      });
    });

    describe('ENR-10: 수강 정보 수정 실패', () => {
      it('존재하지 않는 수강 정보 수정 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.updateEnrollment(
            'invalid-enrollment-id',
            updateEnrollmentRequests.partial,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('권한 없는 수강 정보 수정 시 ForbiddenException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.otherInstructor,
        );

        // Act & Assert
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

  // ============================================
  // [수강 정보 삭제] deleteEnrollment 테스트 케이스
  // ============================================
  describe('[수강 정보 삭제] deleteEnrollment', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ENR-11: 수강 정보 삭제 성공', () => {
      it('강사가 수강 정보를 Soft Delete 할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as any,
        );
        const deletedEnrollment = {
          ...mockEnrollments.active,
          deletedAt: new Date(),
        };
        mockEnrollmentsRepo.softDelete.mockResolvedValue(deletedEnrollment);

        // Act
        const result = await enrollmentsService.deleteEnrollment(
          enrollmentId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toEqual(deletedEnrollment);
        expect(mockEnrollmentsRepo.softDelete).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('조교가 담당 강사의 수강생을 삭제할 수 있다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.active as any,
        );
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        const deletedEnrollment = {
          ...mockEnrollments.active,
          deletedAt: new Date(),
        };
        mockEnrollmentsRepo.softDelete.mockResolvedValue(deletedEnrollment);

        // Act
        const result = await enrollmentsService.deleteEnrollment(
          enrollmentId,
          UserType.ASSISTANT,
          mockAssistants.basic.id,
        );

        // Assert
        expect(result).toEqual(deletedEnrollment);
      });
    });

    describe('ENR-12: 수강 정보 삭제 실패', () => {
      it('존재하지 않는 수강 정보 삭제 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.deleteEnrollment(
            'invalid-enrollment-id',
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('권한 없는 수강 정보 삭제 시 ForbiddenException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findById.mockResolvedValue(
          mockEnrollments.otherInstructor,
        );

        // Act & Assert
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

  // ============================================
  // [학생/학부모용] getEnrollments 테스트 케이스
  // ============================================
  describe('[학생/학부모용] getEnrollments', () => {
    describe('ENR-13: 학생 수강 목록 조회', () => {
      it('학생이 자신의 수강 목록을 조회할 수 있다', async () => {
        // Arrange
        const studentId = mockStudents.basic.id;
        mockEnrollmentsRepo.findByAppStudentId.mockResolvedValue({
          enrollments: [mockEnrollments.active],
          totalCount: 1,
        });

        // Act
        const result = await enrollmentsService.getEnrollments(
          UserType.STUDENT,
          studentId,
          mockEnrollmentQueries.withPagination,
        );

        // Assert
        expect(result.enrollments).toHaveLength(1);
        expect(result.totalCount).toBe(1);
        expect(mockEnrollmentsRepo.findByAppStudentId).toHaveBeenCalledWith(
          studentId,
          mockEnrollmentQueries.withPagination,
        );
      });
    });

    describe('ENR-14: 학부모 수강 목록 조회', () => {
      it('학부모가 자녀들의 수강 목록을 조회할 수 있다', async () => {
        // Arrange
        const parentId = mockParents.basic.id;
        mockEnrollmentsRepo.findByAppParentId.mockResolvedValue([
          mockEnrollments.active,
          mockEnrollments.withoutParentLink,
        ]);

        // Act
        const result = await enrollmentsService.getEnrollments(
          UserType.PARENT,
          parentId,
        );

        // Assert
        expect(result.enrollments).toHaveLength(2);
        expect(result.totalCount).toBe(2);
        expect(mockEnrollmentsRepo.findByAppParentId).toHaveBeenCalledWith(
          parentId,
        );
      });
    });

    describe('ENR-15: 수강 목록 조회 실패', () => {
      it('권한 없는 userType은 ForbiddenException을 던진다', async () => {
        // Act & Assert
        await expect(
          enrollmentsService.getEnrollments(
            UserType.INSTRUCTOR,
            mockInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  // ============================================
  // [학생/학부모용 상세] getEnrollmentById 테스트 케이스
  // ============================================
  describe('[학생/학부모용 상세] getEnrollmentById', () => {
    const enrollmentId = mockEnrollments.active.id;

    describe('ENR-16: 학생 수강 상세 조회', () => {
      it('학생이 자신의 수강 정보를 조회할 수 있다', async () => {
        // Arrange
        const studentId = mockStudents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as any,
        );

        // Act
        const result = await enrollmentsService.getEnrollmentById(
          enrollmentId,
          UserType.STUDENT,
          studentId,
        );

        // Assert
        expect(result).toEqual(mockEnrollments.active);
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
      });

      it('다른 학생의 수강 정보 조회 시 ForbiddenException을 던진다', async () => {
        // Arrange
        const anotherStudentId = mockStudents.another.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as any,
        );

        // Act & Assert
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
      it('학부모가 자녀의 수강 정보를 조회할 수 있다', async () => {
        // Arrange
        const parentId = mockParents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as any,
        );
        mockEnrollmentsRepo.findParentIdByParentChildLinkId.mockResolvedValue({
          appParentId: parentId,
        });

        // Act
        const result = await enrollmentsService.getEnrollmentById(
          enrollmentId,
          UserType.PARENT,
          parentId,
        );

        // Assert
        expect(result).toEqual(mockEnrollments.active);
      });

      it('다른 학부모가 조회 시 ForbiddenException을 던진다', async () => {
        // Arrange
        const anotherParentId = mockParents.another.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.active as any,
        );
        mockEnrollmentsRepo.findParentIdByParentChildLinkId.mockResolvedValue({
          appParentId: mockParents.basic.id,
        });

        // Act & Assert
        await expect(
          enrollmentsService.getEnrollmentById(
            enrollmentId,
            UserType.PARENT,
            anotherParentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('ParentLink가 없는 경우 ForbiddenException을 던진다', async () => {
        // Arrange
        const parentId = mockParents.basic.id;
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.withoutParentLink,
        );

        // Act & Assert
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
      it('존재하지 않는 수강 정보 조회 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        // Act & Assert
        await expect(
          enrollmentsService.getEnrollmentById(
            'invalid-enrollment-id',
            UserType.STUDENT,
            mockStudents.basic.id,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('삭제된 수강 정보 조회 시 NotFoundException을 던진다', async () => {
        // Arrange
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollments.deleted as any,
        );

        // Act & Assert
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

  // ============================================
  // [Helper 함수] getEffectiveInstructorId 테스트 케이스
  // ============================================
  describe('[Helper 함수] getEffectiveInstructorId', () => {
    describe('ENR-19: 조교 권한 검증', () => {
      it('조교는 담당 강사 ID로 변환된다', async () => {
        // Arrange
        mockAssistantRepo.findById.mockResolvedValue(mockAssistants.basic);
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.findManyByInstructorId.mockResolvedValue([] as any);

        // Act
        await enrollmentsService.getEnrollmentsByInstructor(
          UserType.ASSISTANT,
          mockAssistants.basic.id,
          mockEnrollmentQueries.withPagination,
        );

        // Assert
        expect(mockAssistantRepo.findById).toHaveBeenCalledWith(
          mockAssistants.basic.id,
        );
        expect(mockEnrollmentsRepo.findManyByInstructorId).toHaveBeenCalledWith(
          mockAssistants.basic.instructorId,
          mockEnrollmentQueries.withPagination,
        );
      });

      it('조교 정보가 없으면 NotFoundException을 던진다', async () => {
        // Arrange
        mockAssistantRepo.findById.mockResolvedValue(null);

        // Act & Assert
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
      it('STUDENT/PARENT 타입은 ForbiddenException을 던진다', async () => {
        // Act & Assert
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
});
