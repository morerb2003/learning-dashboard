export interface CourseReview {
  id: string;
  course_id: string;
  student_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}
