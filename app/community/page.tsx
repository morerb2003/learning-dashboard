import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommunityWorkspace from "@/components/community/CommunityWorkspace";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/community");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: contactRows } = await supabase.rpc("get_communication_contacts");
  const contacts = contactRows ?? [];

  let courses: Array<{ id: string; title: string }> = [];
  if (profile.role === "admin") {
    const { data } = await supabase.from("courses").select("id, title").order("title");
    courses = data ?? [];
  } else if (profile.role === "teacher") {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .eq("teacher_id", user.id)
      .order("title");
    courses = data ?? [];
  } else {
    const { data: enrollmentRows } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id);
    const courseIds = (enrollmentRows ?? []).map((row) => row.course_id);
    if (courseIds.length > 0) {
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds)
        .order("title");
      courses = data ?? [];
    }
  }

  const courseIds = courses.map((course) => course.id);
  const [messagesResult, discussionsResult, announcementsResult] = await Promise.all([
    supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at"),
    courseIds.length > 0
      ? supabase
          .from("course_discussions")
          .select("id, course_id, author_id, title, body, is_locked, created_at")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("platform_announcements")
      .select("id, author_id, course_id, title, body, audience, published_at")
      .order("published_at", { ascending: false }),
  ]);

  const discussions = discussionsResult.data ?? [];
  const discussionIds = discussions.map((discussion) => discussion.id);
  const repliesResult =
    discussionIds.length > 0
      ? await supabase
          .from("discussion_replies")
          .select("id, discussion_id, author_id, body, created_at")
          .in("discussion_id", discussionIds)
          .order("created_at")
      : { data: [] };

  return (
    <CommunityWorkspace
      currentUser={profile}
      contacts={contacts}
      courses={courses}
      initialMessages={messagesResult.data ?? []}
      initialDiscussions={discussions}
      initialReplies={repliesResult.data ?? []}
      initialAnnouncements={announcementsResult.data ?? []}
    />
  );
}
