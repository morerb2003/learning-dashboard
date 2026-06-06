export interface Course {
  id: string;
  teacher_id?: string | null;
  title: string;
  progress: number;
  icon_name: string;
  thumbnail_url?: string | null;
  created_at: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  teacher_name?: string | null;
  color?: string | null;
  is_published?: boolean | null;
}
