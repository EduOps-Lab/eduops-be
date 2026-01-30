import { fakerKO as faker } from '@faker-js/faker';
import { UserType } from '../../constants/auth.constant.js';

/** Mock User 데이터 */
export const mockUsers = {
  instructor: {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: false,
    name: faker.person.fullName(),
    image: null,
    userType: UserType.INSTRUCTOR,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  assistant: {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: false,
    name: faker.person.fullName(),
    image: null,
    userType: UserType.ASSISTANT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  student: {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: false,
    name: faker.person.fullName(),
    image: null,
    userType: UserType.STUDENT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  parent: {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    emailVerified: false,
    name: faker.person.fullName(),
    image: null,
    userType: UserType.PARENT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
} as const;
