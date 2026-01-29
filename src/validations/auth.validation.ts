import { z } from 'zod';
import { UserType } from '../constants/auth.constant.js';
import { Regex } from '../constants/regex.constant.js';

// 공통 필드
const emailSchema = z.string().email('유효한 이메일 형식이 아닙니다.');
const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .regex(Regex.PASSWORD_ALPHA, '비밀번호에 영문자가 포함되어야 합니다.')
  .regex(Regex.PASSWORD_NUMBER, '비밀번호에 숫자가 포함되어야 합니다.');
const phoneSchema = z
  .string()
  .regex(Regex.PHONE, '유효한 전화번호 형식이 아닙니다.');
const userTypeSchema = z.enum([
  UserType.INSTRUCTOR,
  UserType.ASSISTANT,
  UserType.STUDENT,
  UserType.PARENT,
]);

// 로그인 (통합)
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userType: userTypeSchema,
  rememberMe: z.boolean().optional(),
});

// 회원가입 - 강사
export const instructorSignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  phoneNumber: phoneSchema,
  subject: z.string().optional(),
  academy: z.string().optional(),
});

// 회원가입 - 조교
export const assistantSignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  phoneNumber: phoneSchema,
  signupCode: z.string().min(1, '조교가입코드가 필요합니다.'),
});

// 회원가입 - 학생
export const studentSignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  phoneNumber: phoneSchema,
  school: z.string().optional(),
  schoolYear: z.string().optional(),
});

// 회원가입 - 학부모
export const parentSignUpSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  password: passwordSchema,
  phoneNumber: phoneSchema,
});
