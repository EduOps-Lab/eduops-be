import { AttendancesService } from './attendances.service.js';
import { NotFoundException } from '../err/http.exception.js';
import {
  createMockAttendancesRepository,
  createMockEnrollmentsRepository,
  createMockLecturesRepository,
  createMockAssistantRepository,
  createMockParentsService,
  createMockPermissionService,
  createMockPrisma,
} from '../test/mocks/index.js';
import {
  mockAttendances,
  mockEnrollments,
  mockLectures,
  mockInstructor,
  createAttendanceRequests,
  bulkAttendanceRequests,
  updateAttendanceRequests,
  mockEnrollmentWithRelations,
} from '../test/fixtures/index.js';
import { UserType } from '../constants/auth.constant.js';
import { AttendanceStatus } from '../constants/attendances.constant.js';
import { PrismaClient } from '../generated/prisma/client.js';

import { EnrollmentsRepository } from '../repos/enrollments.repo.js';

type EnrollmentWithRelations = Awaited<
  ReturnType<EnrollmentsRepository['findByIdWithRelations']>
>;

describe('AttendancesService - @unit #critical', () => {
  // Mock Dependencies
  let mockAttendancesRepo: ReturnType<typeof createMockAttendancesRepository>;
  let mockEnrollmentsRepo: ReturnType<typeof createMockEnrollmentsRepository>;
  let mockLecturesRepo: ReturnType<typeof createMockLecturesRepository>;
  let mockAssistantRepo: ReturnType<typeof createMockAssistantRepository>;
  let mockParentsService: ReturnType<typeof createMockParentsService>;
  let mockPermissionService: ReturnType<typeof createMockPermissionService>;
  let mockPrisma: PrismaClient;

  // Service under test
  let attendancesService: AttendancesService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockAttendancesRepo = createMockAttendancesRepository();
    mockEnrollmentsRepo = createMockEnrollmentsRepository();
    mockLecturesRepo = createMockLecturesRepository();
    mockAssistantRepo = createMockAssistantRepository();
    mockParentsService = createMockParentsService();
    mockPermissionService = createMockPermissionService();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create AttendancesService DI
    attendancesService = new AttendancesService(
      mockAttendancesRepo,
      mockEnrollmentsRepo,
      mockLecturesRepo,
      mockAssistantRepo,
      mockParentsService,
      mockPermissionService,
      mockPrisma,
    );
  });

  describe('[단체 출결 등록] createBulkAttendances', () => {
    const lectureId = mockLectures.basic.id;
    const instructorId = mockInstructor.id;

    describe('ATT-01: 단체 출결 등록 성공', () => {
      it('강사가 자신의 강의에 대해 여러 명의 출결 정보를 한 번에 등록하거나 수정할 수 있다', async () => {
        // Arrange
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );
        mockAttendancesRepo.upsert.mockResolvedValue(mockAttendances.present);

        // Mock $transaction
        (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
          fn(mockPrisma),
        );

        // Act
        const result = await attendancesService.createBulkAttendances(
          lectureId,
          bulkAttendanceRequests,
          UserType.INSTRUCTOR,
          instructorId,
        );

        // Assert
        expect(result).toHaveLength(bulkAttendanceRequests.length);
        expect(mockLecturesRepo.findById).toHaveBeenCalledWith(lectureId);
        expect(
          mockPermissionService.validateInstructorAccess,
        ).toHaveBeenCalledWith(instructorId, UserType.INSTRUCTOR, instructorId);
        expect(mockAttendancesRepo.upsert).toHaveBeenCalledTimes(
          bulkAttendanceRequests.length,
        );
      });
    });

    describe('ATT-02: 단체 출결 등록 실패', () => {
      it('존재하지 않는 강의 ID로 단체 출결 등록을 요청하면 NotFoundException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(null);

        await expect(
          attendancesService.createBulkAttendances(
            'invalid-lecture-id',
            bulkAttendanceRequests,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('해당 강의의 수강생이 아닌 enrollmentId로 출결 등록을 시도하면 NotFoundException을 던진다', async () => {
        mockLecturesRepo.findById.mockResolvedValue(mockLectures.basic);
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue({
          ...mockEnrollmentWithRelations,
          lectureId: 'different-lecture-id',
        } as EnrollmentWithRelations);

        // Mock $transaction
        (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
          fn(mockPrisma),
        );

        await expect(
          attendancesService.createBulkAttendances(
            lectureId,
            bulkAttendanceRequests,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('[단일 출결 등록] createAttendance', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ATT-03: 단일 출결 등록 성공', () => {
      it('강사가 특정 수강생의 특정 날짜 출결 정보를 등록하거나 수정할 수 있다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockAttendancesRepo.upsert.mockResolvedValue(mockAttendances.present);

        const result = await attendancesService.createAttendance(
          enrollmentId,
          createAttendanceRequests.basic,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result).toEqual(mockAttendances.present);
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
        expect(mockAttendancesRepo.upsert).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            enrollmentId,
            status: AttendanceStatus.PRESENT,
          }),
          expect.anything(),
        );
      });
    });

    describe('ATT-04: 단일 출결 등록 실패', () => {
      it('존재하지 않는 수강 정보로 출결 등록을 요청하면 NotFoundException을 던진다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        await expect(
          attendancesService.createAttendance(
            'invalid-enrollment-id',
            createAttendanceRequests.basic,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('[출결 조회] getAttendancesByEnrollment', () => {
    const enrollmentId = mockEnrollments.active.id;
    const instructorId = mockInstructor.id;

    describe('ATT-05: 출결 조회 성공', () => {
      it('권한이 있는 사용자가 특정 수강생의 전체 출결 목록과 통계를 조회할 수 있다', async () => {
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );
        mockPermissionService.validateEnrollmentReadAccess.mockResolvedValue();
        mockAttendancesRepo.findByEnrollmentId.mockResolvedValue([
          mockAttendances.present,
          mockAttendances.absent,
          mockAttendances.late,
        ]);

        const result = await attendancesService.getAttendancesByEnrollment(
          enrollmentId,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result.attendances).toHaveLength(3);
        expect(result.stats).toBeDefined();
        expect(result.stats.totalCount).toBe(3);
        expect(mockAttendancesRepo.findByEnrollmentId).toHaveBeenCalledWith(
          enrollmentId,
        );
      });
    });
  });

  describe('[출결 수정] updateAttendance', () => {
    const enrollmentId = mockEnrollments.active.id;
    const attendanceId = mockAttendances.present.id;
    const instructorId = mockInstructor.id;

    describe('ATT-06: 출결 수정 성공', () => {
      it('강사가 이미 등록된 출결 정보를 수정할 수 있다', async () => {
        mockAttendancesRepo.findById.mockResolvedValue(mockAttendances.present);
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );
        mockPermissionService.validateInstructorAccess.mockResolvedValue();
        mockAttendancesRepo.update.mockResolvedValue({
          ...mockAttendances.present,
          status: AttendanceStatus.ABSENT,
        });

        const result = await attendancesService.updateAttendance(
          enrollmentId,
          attendanceId,
          updateAttendanceRequests.statusOnly,
          UserType.INSTRUCTOR,
          instructorId,
        );

        expect(result.status).toBe(AttendanceStatus.ABSENT);
        expect(mockAttendancesRepo.update).toHaveBeenCalledWith(
          attendanceId,
          expect.objectContaining({ status: AttendanceStatus.ABSENT }),
        );
      });
    });

    describe('ATT-07: 출결 수정 실패', () => {
      it('존재하지 않는 출결 정보 수정을 요청하면 NotFoundException을 던진다', async () => {
        mockAttendancesRepo.findById.mockResolvedValue(null);

        await expect(
          attendancesService.updateAttendance(
            enrollmentId,
            'invalid-attendance-id',
            updateAttendanceRequests.statusOnly,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('URL의 enrollmentId와 실제 출결 정보의 enrollmentId가 다르면 NotFoundException을 던진다', async () => {
        mockAttendancesRepo.findById.mockResolvedValue(mockAttendances.present);

        await expect(
          attendancesService.updateAttendance(
            'different-enrollment-id',
            attendanceId,
            updateAttendanceRequests.statusOnly,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow(NotFoundException);
        await expect(
          attendancesService.updateAttendance(
            'different-enrollment-id',
            attendanceId,
            updateAttendanceRequests.statusOnly,
            UserType.INSTRUCTOR,
            instructorId,
          ),
        ).rejects.toThrow('해당 수강생의 출결 정보가 아닙니다. (URL 불일치)');
      });
    });
  });
});
