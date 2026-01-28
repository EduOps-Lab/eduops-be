import { ParentsService } from '../../src/services/parents.service.js';
import { UserType } from '../../src/constants/auth.constant.js';
import { EnrollmentStatus } from '../../src/constants/enrollments.constant.js';
import { ParentRepository } from '../../src/repos/parent.repo.js';
import { ParentChildLinkRepository } from '../../src/repos/parent-child-link.repo.js';
import { EnrollmentsRepository } from '../../src/repos/enrollments.repo.js';
import { PrismaClient } from '../../src/generated/prisma/client.js';

// Mock dependencies
const mockParentRepo = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  findByPhoneNumber: jest.fn(),
};
const mockParentChildLinkRepo = {
  create: jest.fn(),
  findByAppParentId: jest.fn(),
  findById: jest.fn(),
  findByParentIdAndPhoneNumber: jest.fn(),
  findManyByPhoneNumber: jest.fn(),
};
const mockEnrollmentsRepo = {
  updateAppParentLinkIdByStudentPhone: jest.fn(),
  findByAppParentLinkId: jest.fn(),
  findByIdWithRelations: jest.fn(),
  updateAppStudentIdByPhoneNumber: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn((callback: (tx: PrismaClient) => Promise<unknown>) =>
    callback(mockPrisma),
  ),
} as unknown as PrismaClient;

describe('ParentsService', () => {
  let parentsService: ParentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    parentsService = new ParentsService(
      mockParentRepo as unknown as ParentRepository,
      mockParentChildLinkRepo as unknown as ParentChildLinkRepository,
      mockEnrollmentsRepo as unknown as EnrollmentsRepository,
      mockPrisma as unknown as PrismaClient,
    );
  });

  describe('registerChild', () => {
    const parentId = 'parent-123';
    const childData = {
      name: 'Son',
      phoneNumber: '010-1234-5678',
    };

    it('should register a new child and link existing enrollments', async () => {
      // Given
      mockParentChildLinkRepo.findByParentIdAndPhoneNumber.mockResolvedValue(
        null,
      );
      mockParentChildLinkRepo.create.mockResolvedValue({
        id: 'link-123',
        ...childData,
      });

      // When
      const result = await parentsService.registerChild(
        UserType.PARENT,
        parentId,
        childData,
      );

      // Then
      expect(mockParentChildLinkRepo.create).toHaveBeenCalled();
      expect(
        mockEnrollmentsRepo.updateAppParentLinkIdByStudentPhone,
      ).toHaveBeenCalledWith(
        childData.phoneNumber,
        'link-123',
        expect.any(Object),
      );
      expect(result.id).toBe('link-123');
    });

    it('should throw ForbiddenException if not parent', async () => {
      await expect(
        parentsService.registerChild(
          UserType.STUDENT,
          'student-123',
          childData,
        ),
      ).rejects.toThrow('학부모만 자녀를 등록할 수 있습니다.'); // "학부모만 자녀를 등록할 수 있습니다."
    });

    it('should throw BadRequestException if child already registered', async () => {
      mockParentChildLinkRepo.findByParentIdAndPhoneNumber.mockResolvedValue({
        id: 'existing-link',
      });

      await expect(
        parentsService.registerChild(UserType.PARENT, parentId, childData),
      ).rejects.toThrow('이미');
    });
  });

  describe('getChildEnrollments', () => {
    const parentId = 'parent-123';
    const childLinkId = 'link-123';

    it('should return enrollments for my child', async () => {
      // Given
      mockParentChildLinkRepo.findById.mockResolvedValue({
        id: childLinkId,
        appParentId: parentId,
      });
      mockEnrollmentsRepo.findByAppParentLinkId.mockResolvedValue([
        { id: 'enroll-1', status: EnrollmentStatus.ACTIVE },
      ]);

      // When
      const result = await parentsService.getChildEnrollments(
        UserType.PARENT,
        parentId,
        childLinkId,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('enroll-1');
    });

    it('should throw ForbiddenException if accessing other parent child', async () => {
      mockParentChildLinkRepo.findById.mockResolvedValue({
        id: childLinkId,
        appParentId: 'other-parent',
      });

      await expect(
        parentsService.getChildEnrollments(
          UserType.PARENT,
          parentId,
          childLinkId,
        ),
      ).rejects.toThrow('본인의 자녀만');
    });
  });
});
