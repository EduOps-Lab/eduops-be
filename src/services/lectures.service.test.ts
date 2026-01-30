import { LecturesService } from './lectures.service.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import {
  createMockLecturesRepository,
  createMockEnrollmentsRepository,
  createMockStudentRepository,
  createMockInstructorRepository,
  createMockPermissionService,
  createMockPrisma,
} from '../test/mocks/index.js';
import {
  mockInstructor,
  mockLectures,
  mockLecturesListResponse,
  createLectureRequests,
  updateLectureRequests,
  mockEnrollments,
} from '../test/fixtures/index.js';

// Aliases for backward compatibility

import { PrismaClient } from '../generated/prisma/client.js';
import { EnrollmentStatus } from '../constants/enrollments.constant.js';
import { UserType } from '../constants/auth.constant.js';

describe('LecturesService', () => {
  // Mock Dependencies
  let mockLecturesRepo: ReturnType<typeof createMockLecturesRepository>;
  let mockEnrollmentsRepo: ReturnType<typeof createMockEnrollmentsRepository>;
  let mockStudentRepo: ReturnType<typeof createMockStudentRepository>;
  let mockInstructorRepo: ReturnType<typeof createMockInstructorRepository>;
  let mockPermissionService: ReturnType<typeof createMockPermissionService>;
  let mockPrisma: PrismaClient;

  // Service under test
  let lecturesService: LecturesService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockLecturesRepo = createMockLecturesRepository();
    mockEnrollmentsRepo = createMockEnrollmentsRepository();
    mockStudentRepo = createMockStudentRepository();
    mockInstructorRepo = createMockInstructorRepository();
    mockPermissionService = createMockPermissionService();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create LecturesService DI
    lecturesService = new LecturesService(
      mockLecturesRepo,
      mockEnrollmentsRepo,
      mockStudentRepo,
      mockInstructorRepo,
      mockPermissionService,
      mockPrisma,
    );
  });

  describe('[강의 생성] createLecture', () => {
    describe('LECTURE-01: 강의 생성 성공', () => {
      it('기본 정보만으로 강의 생성이 성공한다', async () => {
        // Arrange
        mockInstructorRepo.findById.mockResolvedValue(mockInstructor);
        mockLecturesRepo.create.mockResolvedValue({
          ...mockLectures.basic,
          lectureTimes: [],
        });

        // Mock $transaction
        (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
          fn({}),
        );

        // Act
        const result = await lecturesService.createLecture(
          mockInstructor.id,
          createLectureRequests.basic,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(mockLectures.basic.id);
        expect(mockInstructorRepo.findById).toHaveBeenCalledWith(
          mockInstructor.id,
        );
        expect(mockLecturesRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            instructorId: mockInstructor.id,
            title: createLectureRequests.basic.title,
          }),
          expect.anything(),
        );
      });

      it('enrollments와 함께 강의 생성이 성공한다', async () => {
        mockInstructorRepo.findById.mockResolvedValue(mockInstructor);
        mockLecturesRepo.create.mockResolvedValue({
          ...mockLectures.withEnrollments,
          lectureTimes: [],
        });
        mockEnrollmentsRepo.createMany.mockResolvedValue([
          mockEnrollments.active,
          mockEnrollments.withoutParentLink,
        ]);

        // Mock $transaction - callback을 실제로 실행하고 결과 반환
        (mockPrisma.$transaction as jest.Mock).mockImplementation(
          async (fn) => {
            const txResult = await fn({});
            return txResult;
          },
        );

        const result = await lecturesService.createLecture(
          mockInstructor.id,
          createLectureRequests.withEnrollments,
        );

        expect(result).toBeDefined();
        expect(result.enrollments).toBeDefined();
        expect(mockLecturesRepo.create).toHaveBeenCalled();
        expect(mockEnrollmentsRepo.createMany).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              lectureId: mockLectures.withEnrollments.id,
              instructorId: mockInstructor.id,
              status: EnrollmentStatus.ACTIVE,
              studentName:
                createLectureRequests.withEnrollments.enrollments![0]
                  .studentName,
            }),
          ]),
          // anything()은 null이나 undefined을 제외한 모든 값들과 일치시킴
          expect.anything(),
        );
      });
    });

    describe('LECTURE-02: 강의 생성 실패', () => {
      it('존재하지 않는 강사 ID로 생성 시 NotFoundException 발생', async () => {
        mockInstructorRepo.findById.mockResolvedValue(null);

        await expect(
          lecturesService.createLecture(
            'non-existent-instructor-id',
            createLectureRequests.basic,
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          lecturesService.createLecture(
            'non-existent-instructor-id',
            createLectureRequests.basic,
          ),
        ).rejects.toThrow('강사를 찾을 수 없습니다.');

        expect(mockLecturesRepo.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('[강의 수정] updateLecture', () => {
    describe('LECTURE-03: 강의 수정 성공', () => {
      it('본인의 강의 수정이 성공한다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        const updatedLecture = {
          ...mockLectures.basic,
          title: updateLectureRequests.full.title,
          subject: updateLectureRequests.full.subject,
          description: updateLectureRequests.full.description,
          status: updateLectureRequests.full.status,
          startAt: new Date(updateLectureRequests.full.startAt),
          endAt: new Date(updateLectureRequests.full.endAt),
        };
        mockLecturesRepo.update.mockResolvedValue(updatedLecture);

        const result = await lecturesService.updateLecture(
          mockInstructor.id,
          UserType.INSTRUCTOR,
          mockLectures.basic.id,
          updateLectureRequests.full,
        );

        expect(result).toBeDefined();
        expect(result.title).toBe(updateLectureRequests.full.title);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(
          mockLectures.basic.id,
        );
        expect(mockLecturesRepo.update).toHaveBeenCalledWith(
          mockLectures.basic.id,
          expect.objectContaining({
            title: updateLectureRequests.full.title,
            subject: updateLectureRequests.full.subject,
          }),
        );
      });

      it('일부 필드만 수정 시 undefined 필드는 제외된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockLecturesRepo.update.mockResolvedValue({
          ...mockLectures.basic,
          title: updateLectureRequests.partial.title!,
        });

        const result = await lecturesService.updateLecture(
          mockInstructor.id,
          UserType.INSTRUCTOR,
          mockLectures.basic.id,
          updateLectureRequests.partial,
        );

        expect(result).toBeDefined();
        expect(mockLecturesRepo.update).toHaveBeenCalledWith(
          mockLectures.basic.id,
          expect.objectContaining({
            title: updateLectureRequests.partial.title,
          }),
        );
        // undefined였던 description은 update payload에 포함되지 않아야 함
        const updateCall = mockLecturesRepo.update.mock.calls[0][1];
        expect(updateCall).not.toHaveProperty('description');
      });
    });

    describe('LECTURE-04: 강의 수정 실패', () => {
      it('존재하지 않는 강의 수정 시 NotFoundException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          lecturesService.updateLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
            updateLectureRequests.full,
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          lecturesService.updateLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
            updateLectureRequests.full,
          ),
        ).rejects.toThrow('강의를 찾을 수 없습니다.');

        expect(mockLecturesRepo.update).not.toHaveBeenCalled();
      });

      it('다른 강사의 강의 수정 시 ForbiddenException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 강의를 수정할 권한이 없습니다.'),
        );

        await expect(
          lecturesService.updateLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
            updateLectureRequests.full,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          lecturesService.updateLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
            updateLectureRequests.full,
          ),
        ).rejects.toThrow('해당 강의를 수정할 권한이 없습니다.');

        expect(mockLecturesRepo.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('[강의 삭제] deleteLecture', () => {
    describe('LECTURE-05: 강의 삭제 성공', () => {
      it('Soft Delete가 성공적으로 수행된다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockLecturesRepo.softDelete.mockResolvedValue(undefined);

        await lecturesService.deleteLecture(
          mockInstructor.id,
          UserType.INSTRUCTOR,
          mockLectures.basic.id,
        );

        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(
          mockLectures.basic.id,
        );
        expect(mockLecturesRepo.softDelete).toHaveBeenCalledWith(
          mockLectures.basic.id,
        );
      });
    });

    describe('LECTURE-06: 강의 삭제 실패', () => {
      it('존재하지 않는 강의 삭제 시 NotFoundException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          lecturesService.deleteLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          lecturesService.deleteLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
          ),
        ).rejects.toThrow('강의를 찾을 수 없습니다.');

        expect(mockLecturesRepo.softDelete).not.toHaveBeenCalled();
      });

      it('다른 강사의 강의 삭제 시 ForbiddenException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 강의를 삭제할 권한이 없습니다.'),
        );

        await expect(
          lecturesService.deleteLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          lecturesService.deleteLecture(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
          ),
        ).rejects.toThrow('해당 강의를 삭제할 권한이 없습니다.');

        expect(mockLecturesRepo.softDelete).not.toHaveBeenCalled();
      });
    });
  });

  describe('[강의 조회] getLectureById', () => {
    describe('LECTURE-07: 강의 조회 성공', () => {
      it('본인의 강의 조회가 성공한다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);

        const result = await lecturesService.getLectureById(
          mockInstructor.id,
          UserType.INSTRUCTOR,
          mockLectures.basic.id,
        );

        expect(result).toBeDefined();
        expect(result.id).toBe(mockLectures.basic.id);
        expect(result.instructorId).toBe(mockInstructor.id);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(
          mockLectures.basic.id,
        );
      });
    });

    describe('LECTURE-08: 강의 조회 실패', () => {
      it('존재하지 않는 강의 조회 시 NotFoundException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          lecturesService.getLectureById(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          lecturesService.getLectureById(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            'non-existent-lecture-id',
          ),
        ).rejects.toThrow('강의를 찾을 수 없습니다.');
      });

      it('다른 강사의 강의 조회 시 ForbiddenException 발생', async () => {
        mockLecturesRepo.findById.mockResolvedValue(
          mockLectures.otherInstructor,
        );
        mockPermissionService.validateInstructorAccess.mockRejectedValue(
          new ForbiddenException('해당 강의를 조회할 권한이 없습니다.'),
        );

        await expect(
          lecturesService.getLectureById(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          lecturesService.getLectureById(
            mockInstructor.id,
            UserType.INSTRUCTOR,
            mockLectures.otherInstructor.id,
          ),
        ).rejects.toThrow('해당 강의를 조회할 권한이 없습니다.');
      });
    });
  });

  describe('[강의 목록 조회] getLectures', () => {
    describe('LECTURE-09: 강의 목록 조회 성공', () => {
      it('강의 목록과 페이지네이션 정보를 반환한다', async () => {
        mockLecturesRepo.findMany.mockResolvedValue(mockLecturesListResponse);

        const result = await lecturesService.getLectures(mockInstructor.id, {
          page: 1,
          limit: 4,
        });

        expect(result).toBeDefined();
        expect(result.lectures).toHaveLength(2);
        expect(result.pagination).toMatchObject({
          totalCount: 2,
          totalPage: 1,
          currentPage: 1,
          limit: 4,
          hasNextPage: false,
          hasPrevPage: false,
        });
        expect(mockLecturesRepo.findMany).toHaveBeenCalledWith({
          page: 1,
          limit: 4,
          instructorId: mockInstructor.id,
          search: undefined,
        });
      });

      it('검색어로 필터링된 결과를 반환한다', async () => {
        mockLecturesRepo.findMany.mockResolvedValue({
          lectures: [mockLectures.basic],
          totalCount: 1,
        });

        const result = await lecturesService.getLectures(mockInstructor.id, {
          page: 1,
          limit: 4,
          search: 'Basic',
        });

        expect(result.lectures).toHaveLength(1);
        expect(mockLecturesRepo.findMany).toHaveBeenCalledWith({
          page: 1,
          limit: 4,
          instructorId: mockInstructor.id,
          search: 'Basic',
        });
      });
    });
  });
});
