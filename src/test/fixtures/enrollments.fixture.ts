import type {
  Enrollment,
  AppStudent,
  AppParent,
  Assistant,
} from '../../generated/prisma/client.js';
import { EnrollmentStatus } from '../../constants/enrollments.constant.js';

/** Mock AppStudent 데이터 */
export const mockStudents = {
  basic: {
    id: 'student-id-001',
    userId: 'user-student-id-001',
    phoneNumber: '010-1111-2222',
    school: '서울고등학교',
    schoolYear: '고1',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as AppStudent,

  withParentLink: {
    id: 'student-id-002',
    userId: 'user-student-id-002',
    phoneNumber: '010-5555-6666',
    school: '서울고등학교',
    schoolYear: '고2',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as AppStudent,

  another: {
    id: 'student-id-003',
    userId: 'user-student-id-003',
    phoneNumber: '010-9999-8888',
    school: '강남고등학교',
    schoolYear: '고1',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as AppStudent,
};

/** Mock AppParent 데이터 */
export const mockParents = {
  basic: {
    id: 'parent-id-001',
    userId: 'user-parent-id-001',
    phoneNumber: '010-3333-4444',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as AppParent,

  another: {
    id: 'parent-id-002',
    userId: 'user-parent-id-002',
    phoneNumber: '010-7777-8888',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as AppParent,
};

/** Mock ParentChildLink 데이터 */
export const mockParentLinks = {
  active: {
    id: 'parent-link-001',
    appParentId: 'parent-id-001',
    phoneNumber: '010-1111-2222',
    name: '김철수',
    createdAt: new Date('2024-01-01'),
    parent: {
      id: 'parent-id-001',
      userId: 'user-parent-id-001',
      phoneNumber: '010-3333-4444',
      createdAt: new Date('2024-01-01'),
    },
  },

  another: {
    id: 'parent-link-002',
    appParentId: 'parent-id-002',
    phoneNumber: '010-5555-6666',
    name: '이영희',
    createdAt: new Date('2024-01-01'),
    parent: {
      id: 'parent-id-002',
      userId: 'user-parent-id-002',
      phoneNumber: '010-7777-8888',
      createdAt: new Date('2024-01-01'),
    },
  },
};

/** Mock Assistant 데이터 */
export const mockAssistants = {
  basic: {
    id: 'assistant-id-001',
    userId: 'user-assistant-id-001',
    instructorId: 'instructor-id-123',
    phoneNumber: '010-2222-3333',
    signupCode: null,
    contract: null,
    createdAt: new Date('2024-01-01'),
  } as Assistant,

  otherInstructor: {
    id: 'assistant-id-002',
    userId: 'user-assistant-id-002',
    instructorId: 'other-instructor-id',
    phoneNumber: '010-4444-5555',
    signupCode: null,
    contract: null,
    createdAt: new Date('2024-01-01'),
  } as Assistant,
};

/** Mock Enrollment 데이터 */
export const mockEnrollments = {
  active: {
    id: 'enrollment-id-001',
    lectureId: 'lecture-id-002',
    instructorId: 'instructor-id-123',
    appStudentId: 'student-id-001',
    appParentLinkId: 'parent-link-001',
    studentName: '김철수',
    school: '서울고등학교',
    schoolYear: '고1',
    studentPhone: '010-1111-2222',
    parentPhone: '010-3333-4444',
    status: EnrollmentStatus.ACTIVE,
    registeredAt: new Date('2024-02-01'),
    memo: null,
    deletedAt: null,
  } as Enrollment,

  withoutParentLink: {
    id: 'enrollment-id-002',
    lectureId: 'lecture-id-002',
    instructorId: 'instructor-id-123',
    appStudentId: 'student-id-002',
    appParentLinkId: null,
    studentName: '이영희',
    school: '서울고등학교',
    schoolYear: '고2',
    studentPhone: '010-5555-6666',
    parentPhone: '010-7777-8888',
    status: EnrollmentStatus.ACTIVE,
    registeredAt: new Date('2024-02-01'),
    memo: null,
    deletedAt: null,
  } as Enrollment,

  deleted: {
    id: 'enrollment-id-003',
    lectureId: 'lecture-id-002',
    instructorId: 'instructor-id-123',
    appStudentId: 'student-id-003',
    appParentLinkId: null,
    studentName: '박민수',
    school: '강남고등학교',
    schoolYear: '고1',
    studentPhone: '010-9999-8888',
    parentPhone: '010-7777-6666',
    status: EnrollmentStatus.ACTIVE,
    registeredAt: new Date('2024-02-01'),
    memo: null,
    deletedAt: new Date('2024-03-01'),
  } as Enrollment,

  otherInstructor: {
    id: 'enrollment-id-004',
    lectureId: 'lecture-id-003',
    instructorId: 'other-instructor-id',
    appStudentId: 'student-id-003',
    appParentLinkId: null,
    studentName: '최민수',
    school: '강남고등학교',
    schoolYear: '고2',
    studentPhone: '010-8888-7777',
    parentPhone: '010-6666-5555',
    status: EnrollmentStatus.ACTIVE,
    registeredAt: new Date('2024-02-01'),
    memo: null,
    deletedAt: null,
  } as Enrollment,

  withMemo: {
    id: 'enrollment-id-005',
    lectureId: 'lecture-id-001',
    instructorId: 'instructor-id-123',
    appStudentId: null,
    appParentLinkId: null,
    studentName: '정수진',
    school: '서울고등학교',
    schoolYear: '고3',
    studentPhone: '010-1234-9999',
    parentPhone: '010-9999-1234',
    status: EnrollmentStatus.ACTIVE,
    registeredAt: new Date('2024-02-01'),
    memo: '성적 향상 중',
    deletedAt: null,
  } as Enrollment,
};

/** 수강 등록 요청 DTO */
export const createEnrollmentRequests = {
  basic: {
    studentName: '김철수',
    school: '서울고등학교',
    schoolYear: '고1',
    studentPhone: '010-1111-2222',
    parentPhone: '010-3333-4444',
  },

  withParentLink: {
    studentName: '이영희',
    school: '강남고등학교',
    schoolYear: '고2',
    studentPhone: '010-5555-6666',
    parentPhone: '010-7777-8888',
    appParentLinkId: 'parent-link-001',
  },

  withMemo: {
    studentName: '박민수',
    school: '서울고등학교',
    schoolYear: '고3',
    studentPhone: '010-9999-8888',
    parentPhone: '010-8888-9999',
    memo: '수학 집중 코칭 필요',
  },
};

/** 수강 정보 수정 요청 DTO */
export const updateEnrollmentRequests = {
  full: {
    studentName: '김철수 (수정)',
    school: '강남고등학교',
    schoolYear: '고2',
    studentPhone: '010-1111-3333',
    parentPhone: '010-4444-5555',
    memo: '성적 향상 중',
    status: EnrollmentStatus.ACTIVE,
  },

  partial: {
    memo: '출석 우수',
  },

  statusChange: {
    status: EnrollmentStatus.DROPPED,
  },
};

/** Enrollment with Relations (조회 시 사용) */
export const mockEnrollmentWithRelations = {
  ...mockEnrollments.active,
  lecture: {
    id: 'lecture-id-002',
    title: 'Advanced Mathematics',
    subject: 'Math',
    description: 'Advanced math course',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-12-31'),
    status: 'SCHEDULED',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    instructorId: 'instructor-id-123',
    instructor: {
      id: 'instructor-id-123',
      phoneNumber: '010-1234-5678',
      subject: 'Mathematics',
      academy: 'Test Academy',
      user: {
        name: '홍길동',
      },
    },
  },
  grades: [],
  clinicTargets: [],
  attendances: [],
};

/** Enrollment with Relations (학부모용 - 간소화된 관계) */
export const mockEnrollmentWithRelationsForParent = {
  ...mockEnrollments.active,
  lecture: {
    id: 'lecture-id-002',
    title: 'Advanced Mathematics',
    subject: 'Math',
    description: 'Advanced math course',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-12-31'),
    status: 'SCHEDULED',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    instructorId: 'instructor-id-123',
    instructor: {
      id: 'instructor-id-123',
      phoneNumber: '010-1234-5678',
      subject: 'Mathematics',
      academy: 'Test Academy',
      user: {
        name: '홍길동',
      },
    },
  },
};

/** Mock Enrollment 배열 (목록 조회용) */
export const mockEnrollmentsList = [
  mockEnrollments.active,
  mockEnrollments.withoutParentLink,
  mockEnrollments.withMemo,
];

/** Mock Query DTO */
export const mockEnrollmentQueries = {
  withPagination: {
    page: 1,
    limit: 10,
  },

  withFilters: {
    page: 1,
    limit: 10,
    status: EnrollmentStatus.ACTIVE,
    lectureId: 'lecture-id-002',
  },
};
