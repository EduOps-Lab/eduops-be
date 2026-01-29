import { ParentsService } from './parents.service.js';
import { UserType } from '../constants/auth.constant.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../err/http.exception.js';
import {
  createMockParentRepository,
  createMockParentChildLinkRepository,
  createMockEnrollmentsRepository,
  createMockPrisma,
} from '../test/mocks/index.js';
import {
  mockParents,
  mockParentLinks,
  mockEnrollments,
  mockEnrollmentWithRelations,
  mockEnrollmentWithRelationsForParent,
} from '../test/fixtures/index.js';
import { PrismaClient } from '../generated/prisma/client.js';

describe('ParentsService - @unit #critical', () => {
  // Mock Dependencies
  let mockParentRepo: ReturnType<typeof createMockParentRepository>;
  let mockParentChildLinkRepo: ReturnType<
    typeof createMockParentChildLinkRepository
  >;
  let mockEnrollmentsRepo: ReturnType<typeof createMockEnrollmentsRepository>;
  let mockPrisma: PrismaClient;

  // Service under test
  let parentsService: ParentsService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockParentRepo = createMockParentRepository();
    mockParentChildLinkRepo = createMockParentChildLinkRepository();
    mockEnrollmentsRepo = createMockEnrollmentsRepository();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create ParentsService DI
    parentsService = new ParentsService(
      mockParentRepo,
      mockParentChildLinkRepo,
      mockEnrollmentsRepo,
      mockPrisma,
    );
  });

  /** [자녀 등록] registerChild 테스트 케이스 */
  describe('[자녀 등록] registerChild', () => {
    const parentId = mockParents.basic.id;
    const childData = {
      name: '김철수',
      phoneNumber: '010-1111-2222',
    };

    describe('PAR-01: 자녀 등록 성공', () => {
      it('학부모가 신규 자녀를 등록할 때, 자녀 정보가 생성되고 기존 수강 내역이 자동으로 연결된다', async () => {
        // Arrange
        mockParentChildLinkRepo.findByParentIdAndPhoneNumber.mockResolvedValue(
          null,
        );
        mockParentChildLinkRepo.create.mockResolvedValue(
          mockParentLinks.active,
        );
        mockEnrollmentsRepo.updateAppParentLinkIdByStudentPhone.mockResolvedValue(
          { count: 2 },
        );

        // Mock $transaction
        (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
          fn(mockPrisma),
        );

        // Act
        const result = await parentsService.registerChild(
          UserType.PARENT,
          parentId,
          childData,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(mockParentLinks.active.id);
        expect(
          mockParentChildLinkRepo.findByParentIdAndPhoneNumber,
        ).toHaveBeenCalledWith(parentId, childData.phoneNumber);
        expect(mockParentChildLinkRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            appParentId: parentId,
            name: childData.name,
            phoneNumber: childData.phoneNumber,
          }),
          expect.anything(),
        );
        expect(
          mockEnrollmentsRepo.updateAppParentLinkIdByStudentPhone,
        ).toHaveBeenCalledWith(
          childData.phoneNumber,
          mockParentLinks.active.id,
          expect.anything(),
        );
      });

      it('학부모가 자녀를 등록할 때, 등록 과정의 모든 처리가 트랜잭션 내에서 수행된다', async () => {
        mockParentChildLinkRepo.findByParentIdAndPhoneNumber.mockResolvedValue(
          null,
        );
        mockParentChildLinkRepo.create.mockResolvedValue(
          mockParentLinks.active,
        );

        let transactionCalled = false;
        (mockPrisma.$transaction as jest.Mock).mockImplementation(
          async (fn) => {
            transactionCalled = true;
            return await fn(mockPrisma);
          },
        );

        await parentsService.registerChild(
          UserType.PARENT,
          parentId,
          childData,
        );

        expect(transactionCalled).toBe(true);
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('PAR-02: 자녀 등록 실패 - 권한 검증', () => {
      it('학부모 권한이 없는 사용자가 자녀를 등록하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.registerChild(
            UserType.STUDENT,
            'student-id',
            childData,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.registerChild(
            UserType.STUDENT,
            'student-id',
            childData,
          ),
        ).rejects.toThrow('학부모만 자녀를 등록할 수 있습니다.');
      });

      it('강사가 자녀를 등록하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.registerChild(
            UserType.INSTRUCTOR,
            'instructor-id',
            childData,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('PAR-03: 자녀 등록 실패 - 중복 검증', () => {
      it('학부모가 이미 등록된 자녀 번호로 등록을 시도할 때, BadRequestException을 던진다', async () => {
        mockParentChildLinkRepo.findByParentIdAndPhoneNumber.mockResolvedValue(
          mockParentLinks.active,
        );

        await expect(
          parentsService.registerChild(UserType.PARENT, parentId, childData),
        ).rejects.toThrow(BadRequestException);

        await expect(
          parentsService.registerChild(UserType.PARENT, parentId, childData),
        ).rejects.toThrow('이미 등록된 자녀 번호입니다.');
      });
    });
  });

  describe('[자녀 목록 조회] getChildren', () => {
    const parentId = mockParents.basic.id;

    describe('PAR-04: 자녀 목록 조회 성공', () => {
      it('학부모가 자녀 목록 조회를 요청할 때, 등록된 모든 자녀 목록이 반환된다', async () => {
        const childrenList = [mockParentLinks.active, mockParentLinks.another];
        mockParentChildLinkRepo.findByAppParentId.mockResolvedValue(
          childrenList,
        );

        const result = await parentsService.getChildren(
          UserType.PARENT,
          parentId,
        );

        expect(result).toEqual(childrenList);
        expect(result).toHaveLength(2);
        expect(mockParentChildLinkRepo.findByAppParentId).toHaveBeenCalledWith(
          parentId,
        );
      });

      it('등록된 자녀가 없는 학부모가 목록 조회를 요청할 때, 빈 배열이 반환된다', async () => {
        mockParentChildLinkRepo.findByAppParentId.mockResolvedValue([]);

        const result = await parentsService.getChildren(
          UserType.PARENT,
          parentId,
        );

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('PAR-05: 자녀 목록 조회 실패', () => {
      it('학부모 권한이 없는 사용자가 자녀 목록을 조회하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.getChildren(UserType.STUDENT, 'student-id'),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildren(UserType.STUDENT, 'student-id'),
        ).rejects.toThrow('학부모만 자녀 목록을 조회할 수 있습니다.');
      });

      it('강사가 자녀 목록을 조회하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.getChildren(UserType.INSTRUCTOR, 'instructor-id'),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('[자녀 수강 목록 조회] getChildEnrollments', () => {
    const parentId = mockParents.basic.id;
    const childLinkId = mockParentLinks.active.id;

    describe('PAR-06: 수강 목록 조회 성공', () => {
      it('학부모가 본인 자녀의 수강 목록 조회를 요청할 때, 수강 정보 배열이 반환된다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        const enrollmentsResult = {
          enrollments: [mockEnrollmentWithRelationsForParent],
          totalCount: 1,
        };
        mockEnrollmentsRepo.findByAppParentLinkId.mockResolvedValue(
          enrollmentsResult,
        );

        const result = await parentsService.getChildEnrollments(
          UserType.PARENT,
          parentId,
          childLinkId,
        );

        expect(result).toBeDefined();
        expect(result.enrollments).toHaveLength(1);
        expect(result.totalCount).toBe(1);
        expect(result.enrollments[0].id).toBe(mockEnrollments.active.id);
        expect(mockParentChildLinkRepo.findById).toHaveBeenCalledWith(
          childLinkId,
        );
        expect(mockEnrollmentsRepo.findByAppParentLinkId).toHaveBeenCalledWith(
          childLinkId,
          undefined,
        );
      });

      it('학부모가 페이지네이션 옵션과 함께 자녀의 수강 목록 조회를 요청할 때, 요청된 범위의 목록과 전체 개수가 반환된다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        const enrollmentsResult = {
          enrollments: [mockEnrollmentWithRelationsForParent],
          totalCount: 10,
        };
        mockEnrollmentsRepo.findByAppParentLinkId.mockResolvedValue(
          enrollmentsResult,
        );

        const query = { page: 1, limit: 10 };

        const result = await parentsService.getChildEnrollments(
          UserType.PARENT,
          parentId,
          childLinkId,
          query,
        );

        expect(result.totalCount).toBe(10);
        expect(mockEnrollmentsRepo.findByAppParentLinkId).toHaveBeenCalledWith(
          childLinkId,
          query,
        );
      });
    });

    describe('PAR-07: 수강 목록 조회 실패', () => {
      it('학부모가 다른 학부모의 자녀 수강 목록을 조회하려 할 때, ForbiddenException을 던진다', async () => {
        const otherParentLink = {
          ...mockParentLinks.active,
          appParentId: mockParents.another.id,
        };
        mockParentChildLinkRepo.findById.mockResolvedValue(otherParentLink);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            childLinkId,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            childLinkId,
          ),
        ).rejects.toThrow('본인의 자녀만 조회할 수 있습니다.');
      });

      it('학부모가 존재하지 않는 자녀 ID로 수강 목록을 조회하려 할 때, NotFoundException을 던진다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(null);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            'invalid-child-id',
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            'invalid-child-id',
          ),
        ).rejects.toThrow('자녀 정보를 찾을 수 없습니다.');
      });

      it('학부모 권한이 없는 사용자가 자녀 수강 목록을 조회하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.getChildEnrollments(
            UserType.STUDENT,
            'student-id',
            childLinkId,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildEnrollments(
            UserType.STUDENT,
            'student-id',
            childLinkId,
          ),
        ).rejects.toThrow('접근 권한이 없습니다.');
      });
    });
  });

  describe('[자녀 수강 상세 조회] getChildEnrollmentDetail', () => {
    const parentId = mockParents.basic.id;
    const childLinkId = mockParentLinks.active.id;
    const enrollmentId = mockEnrollments.active.id;

    describe('PAR-08: 수강 상세 조회 성공', () => {
      it('학부모가 본인 자녀의 수강 상세 정보 조회를 요청할 때, 상세 수강 정보가 반환된다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          mockEnrollmentWithRelations,
        );

        const result = await parentsService.getChildEnrollmentDetail(
          UserType.PARENT,
          parentId,
          childLinkId,
          enrollmentId,
        );

        expect(result).toBeDefined();
        expect(result.id).toBe(enrollmentId);
        expect(mockParentChildLinkRepo.findById).toHaveBeenCalledWith(
          childLinkId,
        );
        expect(mockEnrollmentsRepo.findByIdWithRelations).toHaveBeenCalledWith(
          enrollmentId,
        );
      });
    });

    describe('PAR-09: 수강 상세 조회 실패', () => {
      it('학부모가 다른 학부모의 자녀 수강 상세 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        const otherParentLink = {
          ...mockParentLinks.active,
          appParentId: mockParents.another.id,
        };
        mockParentChildLinkRepo.findById.mockResolvedValue(otherParentLink);

        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.PARENT,
            parentId,
            childLinkId,
            enrollmentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('학부모가 존재하지 않는 수강 ID로 상세 조회를 요청할 때, NotFoundException을 던진다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(null);

        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.PARENT,
            parentId,
            childLinkId,
            'invalid-enrollment-id',
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.PARENT,
            parentId,
            childLinkId,
            'invalid-enrollment-id',
          ),
        ).rejects.toThrow('수강 정보를 찾을 수 없습니다.');
      });

      it('학부모가 본인 자녀의 것이 아닌 수강 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        const differentEnrollment = {
          ...mockEnrollmentWithRelations,
          appParentLinkId: 'different-link-id',
        };
        mockEnrollmentsRepo.findByIdWithRelations.mockResolvedValue(
          differentEnrollment,
        );

        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.PARENT,
            parentId,
            childLinkId,
            enrollmentId,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.PARENT,
            parentId,
            childLinkId,
            enrollmentId,
          ),
        ).rejects.toThrow(
          '해당 자녀의 수강 정보가 아니거나 접근 권한이 없습니다.',
        );
      });

      it('학부모 권한이 없는 사용자가 수강 상세 정보를 조회하려 할 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.getChildEnrollmentDetail(
            UserType.INSTRUCTOR,
            'instructor-id',
            childLinkId,
            enrollmentId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('[Helper 함수] validateChildAccess', () => {
    const parentId = mockParents.basic.id;
    const childLinkId = mockParentLinks.active.id;

    describe('PAR-10: 자녀 접근 권한 검증 성공', () => {
      it('권한이 있는 학부모가 자녀 정보 조회를 요청할 때, 접근 권한 검증이 성공한다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(
          mockParentLinks.active,
        );
        mockEnrollmentsRepo.findByAppParentLinkId.mockResolvedValue({
          enrollments: [],
          totalCount: 0,
        });

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            childLinkId,
          ),
        ).resolves.toBeDefined();

        expect(mockParentChildLinkRepo.findById).toHaveBeenCalledWith(
          childLinkId,
        );
      });
    });

    describe('PAR-11: 자녀 접근 권한 검증 실패', () => {
      it('학부모가 아닌 사용자가 자녀 접근 권한 검증을 거칠 때, ForbiddenException을 던진다', async () => {
        await expect(
          parentsService.getChildEnrollments(
            UserType.STUDENT,
            'student-id',
            childLinkId,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildEnrollments(
            UserType.INSTRUCTOR,
            'instructor-id',
            childLinkId,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('존재하지 않는 자녀 ID에 대해 접근 권한 검증을 시도할 때, NotFoundException을 던진다', async () => {
        mockParentChildLinkRepo.findById.mockResolvedValue(null);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            'invalid-child-id',
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('학부모가 다른 사람의 자녀에 대해 접근 권한 검증을 시도할 때, ForbiddenException을 던진다', async () => {
        const otherParentLink = {
          ...mockParentLinks.active,
          appParentId: mockParents.another.id,
        };
        mockParentChildLinkRepo.findById.mockResolvedValue(otherParentLink);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            childLinkId,
          ),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          parentsService.getChildEnrollments(
            UserType.PARENT,
            parentId,
            childLinkId,
          ),
        ).rejects.toThrow('본인의 자녀만 조회할 수 있습니다.');
      });
    });
  });
});
