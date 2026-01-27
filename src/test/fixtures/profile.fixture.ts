/** Profile Mock 데이터 */
export const mockProfiles = {
  instructor: {
    id: 'instructor-profile-id',
    userId: 'test-instructor-id',
    phoneNumber: '010-1234-5678',
    subject: 'Mathematics',
    academy: 'Test Academy',
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  assistant: {
    id: 'assistant-profile-id',
    userId: 'test-assistant-id',
    phoneNumber: '010-2345-6789',
    instructorId: 'instructor-id-123',
    signupCode: 'VALID-CODE-123',
    contract: null,
    createdAt: new Date('2024-01-01'),
  },
  student: {
    id: 'student-profile-id',
    userId: 'test-student-id',
    phoneNumber: '010-3456-7890',
    school: 'Test High School',
    schoolYear: '2',
    createdAt: new Date('2024-01-01'),
  },
  parent: {
    id: 'parent-profile-id',
    userId: 'test-parent-id',
    phoneNumber: '010-4567-8901',
    createdAt: new Date('2024-01-01'),
  },
} as const;
