import type { Course } from "@/types/course";

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
  last_accessed_at: string;
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}
