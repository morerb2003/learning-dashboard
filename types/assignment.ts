export interface Assignment {
  id: string;
  teacher_id: string;
  course_id: string | null;
  title: string;
  instructions: string;
  deadline: string;
  max_grade: number;
  created_at: string;
  courses?: {
    id: string;
    title: string;
  } | null;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  file_path: string;
  status: "submitted" | "reviewed";
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  assignments?: Assignment | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}
