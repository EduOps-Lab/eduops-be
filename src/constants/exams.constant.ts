export const QuestionType = {
  MULTIPLE: 'MULTIPLE',
  ESSAY: 'ESSAY',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];
