import { fakerKO as faker } from '@faker-js/faker';
import type { Lecture, Instructor } from '../../generated/prisma/client.js';
import { LectureStatus } from '../../constants/lectures.constant.js';
import { mockProfiles } from './profile.fixture.js';

/** Mock Instructor 데이터 */
export const mockInstructor: Instructor = {
  ...mockProfiles.instructor,
} as Instructor;

/** Mock Lecture 데이터 */
export const mockLectures = {
  /** 기본 강의 */
  basic: {
    id: faker.string.uuid(),
    instructorId: mockInstructor.id,
    title: faker.commerce.productName() + ' 강의',
    subject: faker.helpers.arrayElement(['국어', '영어', '수학']),
    description: faker.commerce.productDescription(),
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-06-30'),
    status: LectureStatus.IN_PROGRESS,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** Enrollments와 함께 생성될 강의 */
  withEnrollments: {
    id: faker.string.uuid(),
    instructorId: mockInstructor.id,
    title: faker.commerce.productName() + ' 심화 강의',
    subject: faker.helpers.arrayElement(['국어', '영어', '수학']),
    description: faker.commerce.productDescription(),
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-12-31'),
    status: LectureStatus.SCHEDULED,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** 다른 강사의 강의 (권한 테스트용) */
  otherInstructor: {
    id: faker.string.uuid(),
    instructorId: faker.string.uuid(),
    title: '타 강사 강의',
    subject: '기타',
    description: '다른 강사의 강의입니다.',
    startAt: new Date('2024-03-01'),
    endAt: new Date('2024-06-30'),
    status: LectureStatus.IN_PROGRESS,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Lecture,

  /** 종강된 강의 */
  completed: {
    id: faker.string.uuid(),
    instructorId: mockInstructor.id,
    title: '완료된 강의',
    subject: '수학',
    description: '이미 종료된 강의입니다.',
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
    title: faker.commerce.productName() + ' 신규 강의',
    subject: '수학',
    description: faker.lorem.paragraph(),
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
    title: faker.commerce.productName() + ' 패키지 강의',
    subject: '과학',
    description: faker.lorem.paragraph(),
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
        studentName: faker.person.fullName(),
        school: `${faker.person.lastName()}고등학교`,
        schoolYear: '고1',
        studentPhone: faker.phone.number({ style: 'national' }),
        parentPhone: faker.phone.number({ style: 'national' }),
      },
      {
        studentName: faker.person.fullName(),
        school: `${faker.person.lastName()}고등학교`,
        schoolYear: '고2',
        studentPhone: faker.phone.number({ style: 'national' }),
        parentPhone: faker.phone.number({ style: 'national' }),
      },
    ],
  },
};

/** 강의 수정 요청 DTO */
export const updateLectureRequests = {
  /** 전체 필드 수정 */
  full: {
    title: faker.commerce.productName() + ' 수정된 강의명',
    subject: '수정된 과목',
    description: faker.lorem.paragraph(),
    startAt: '2024-04-01',
    endAt: '2024-07-31',
    status: LectureStatus.IN_PROGRESS,
  },

  /** 일부 필드만 수정 */
  partial: {
    title: faker.commerce.productName() + ' 부분 수정',
    description: undefined, // undefined는 제외되어야 함
  },

  /** 제목만 수정 */
  titleOnly: {
    title: '제목만 변경됨',
  },
};

/** 강의 목록 조회 응답 Mock */
export const mockLecturesListResponse = {
  lectures: [mockLectures.basic, mockLectures.withEnrollments],
  totalCount: 2,
};
