import { IsObject } from 'class-validator';

export class SubmitExamDto {
  /**
   * Map of questionId to student's answer(s).
   * Example: { "q1": [0], "q2": ["True"] }
   */
  @IsObject()
  answers: Record<string, any>;
}
