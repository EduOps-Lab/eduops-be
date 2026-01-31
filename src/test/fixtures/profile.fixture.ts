import { fakerKO as faker } from '@faker-js/faker';
import { mockUsers } from './user.fixture.js';

const instructorProfileId = faker.string.uuid();

/** Profile Mock 데이터 */
export const mockProfiles = {
  instructor: {
    id: instructorProfileId,
    userId: mockUsers.instructor.id,
    phoneNumber: faker.phone.number({ style: 'national' }),
    subject: faker.helpers.arrayElement([
      '국어',
      '영어',
      '수학',
      '과학',
      '사회',
    ]),
    academy: `${faker.company.name()} 학원`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  assistant: {
    id: faker.string.uuid(),
    userId: mockUsers.assistant.id,
    phoneNumber: faker.phone.number({ style: 'national' }),
    instructorId: instructorProfileId,
    signupCode: faker.string.alphanumeric(10).toUpperCase(),
    contract: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  student: {
    id: faker.string.uuid(),
    userId: mockUsers.student.id,
    phoneNumber: faker.phone.number({ style: 'national' }),
    school: `${faker.person.lastName()}고등학교`,
    schoolYear: faker.helpers.arrayElement(['1', '2', '3']),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  parent: {
    id: faker.string.uuid(),
    userId: mockUsers.parent.id,
    phoneNumber: faker.phone.number({ style: 'national' }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
} as const;
