import type { Lecture, Instructor } from '../../generated/prisma/client.js';
import { LectureStatus } from '../../constants/lectures.constant.js';

/** Mock Instructor 데이터 */
export const mockInstructor: Instructor = {
  id: 'instructor-id-123',
  userId: 'user-id-123',
  phoneNumber: '010-1234-5678',
  subject: 'Mathematics',
  academy: 'Test Academy',
  createdAt: new Date('2024-01-01'),
  deletedAt: null,
};

/** Mock 다른 강사 데이터 (권한 테스트용) */
// export const mockOtherInstructor: Instructor = {
//   id: 'other-instructor-id',
//   userId: 'other-user-id',
//   phoneNumber: '010-9876-5432',
//   subject: 'English',
//   academy: 'Other Academy',
//   createdAt: new Date('2024-01-01'),
//   deletedAt: null,
// };

/** Mock Lecture 데이터 */
export const mockLectures = {
  /** 기본 강의 */
  basic: {
    id: 'lecture-id-001',
    instructorId: 'instructor-id-123',
    title: 'Basic Mathematics',
    subject: 'Math',
    description: 'Basic math course',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-06-30'),
    status: LectureStatus.IN_PROGRESS,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** Enrollments와 함께 생성될 강의 */
  withEnrollments: {
    id: 'lecture-id-002',
    instructorId: 'instructor-id-123',
    title: 'Advanced Mathematics',
    subject: 'Math',
    description: 'Advanced math course',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-12-31'),
    status: LectureStatus.SCHEDULED,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** 다른 강사의 강의 (권한 테스트용) */
  otherInstructor: {
    id: 'lecture-id-003',
    instructorId: 'other-instructor-id',
    title: 'English Literature',
    subject: 'English',
    description: 'English course by other instructor',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-06-30'),
    status: LectureStatus.IN_PROGRESS,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** 종강된 강의 */
  completed: {
    id: 'lecture-id-004',
    instructorId: 'instructor-id-123',
    title: 'Completed Course',
    subject: 'Math',
    description: 'This course is completed',
    startAt: new Date('2023-09-01'),
    endAt: new Date('2023-12-31'),
    status: LectureStatus.COMPLETED,
    createdAt: new Date('2023-08-01'),
    deletedAt: null,
  } as Lecture,
} as const;

/** 강의 생성 요청 DTO */
export const createLectureRequests = {
  /** 기본 강의 생성 요청 */
  basic: {
    title: 'New Basic Lecture',
    subject: 'Mathematics',
    description: 'New basic mathematics course',
    startAt: '2024-03-01',
    endAt: '2024-06-30',
    status: LectureStatus.SCHEDULED,
    lectureTimes: [
      {
        day: 'MON',
        startTime: '14:00',
        endTime: '16:00',
      },
      {
        day: 'WED',
        startTime: '14:00',
        endTime: '16:00',
      },
    ],
  },

  /** Enrollments와 함께 생성하는 요청 */
  withEnrollments: {
    title: 'Lecture with Students',
    subject: 'Science',
    description: 'Science course with initial students',
    startAt: '2024-04-01',
    endAt: '2024-08-31',
    status: LectureStatus.SCHEDULED,
    lectureTimes: [
      {
        day: 'TUE',
        startTime: '15:00',
        endTime: '17:00',
      },
    ],
    enrollments: [
      {
        studentName: '박민수',
        school: '강남고등학교',
        schoolYear: '고1',
        studentPhone: '010-1234-5678',
        parentPhone: '010-8765-4321',
      },
      {
        studentName: '최지영',
        school: '강남고등학교',
        schoolYear: '고2',
        studentPhone: '010-2345-6789',
        parentPhone: '010-9876-5432',
      },
    ],
  },
};

/** 강의 수정 요청 DTO */
export const updateLectureRequests = {
  /** 전체 필드 수정 */
  full: {
    title: 'Updated Lecture Title',
    subject: 'Updated Subject',
    description: 'Updated description',
    startAt: '2024-04-01',
    endAt: '2024-07-31',
    status: LectureStatus.IN_PROGRESS,
  },

  /** 일부 필드만 수정 */
  partial: {
    title: 'Partially Updated Title',
    description: undefined, // undefined는 제외되어야 함
  },

  /** 제목만 수정 */
  titleOnly: {
    title: 'Only Title Changed',
  },
};

/** 강의 목록 조회 응답 Mock */
export const mockLecturesListResponse = {
  lectures: [mockLectures.basic, mockLectures.withEnrollments],
  totalCount: 2,
};
