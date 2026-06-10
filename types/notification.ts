export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
