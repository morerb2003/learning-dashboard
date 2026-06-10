export type QuestionType = "mcq" | "true_false";

export interface Quiz {
  id: string;
  teacher_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  courses?: {
    id: string;
    title: string;
  } | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answer: string;
  points: number;
  question_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  total_score: number;
  status: "completed";
  submitted_at: string;
  quizzes?: Quiz | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}
