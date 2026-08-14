import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const supabase = await createClient();

    let query = supabase
      .from("course_discussions")
      .select("id, course_id, author_id, title, body, is_locked, created_at, profiles(full_name, email, avatar_url, role)")
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: discussions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const discussionIds = (discussions ?? []).map((d) => d.id);
    let repliesMap: Record<string, any[]> = {};

    if (discussionIds.length > 0) {
      const { data: replies } = await supabase
        .from("discussion_replies")
        .select("id, discussion_id, author_id, body, created_at, profiles(full_name, email, avatar_url, role)")
        .in("discussion_id", discussionIds)
        .order("created_at", { ascending: true });

      for (const r of replies ?? []) {
        if (!repliesMap[r.discussion_id]) {
          repliesMap[r.discussion_id] = [];
        }
        repliesMap[r.discussion_id].push(r);
      }
    }

    const formatted = (discussions ?? []).map((d: any) => ({
      ...d,
      author_name: d.profiles?.full_name || d.profiles?.email?.split("@")[0] || "User",
      replies: repliesMap[d.id] ?? [],
    }));

    return NextResponse.json({ discussions: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, title, body: discussionBody, discussionId } = body;

    const supabase = await createClient();

    // If discussionId is provided, this is a reply to an existing thread
    if (discussionId) {
      if (!discussionBody || !discussionBody.trim()) {
        return NextResponse.json({ error: "Reply body is required." }, { status: 400 });
      }

      const { data: reply, error } = await supabase
        .from("discussion_replies")
        .insert({
          discussion_id: discussionId,
          author_id: user.id,
          body: discussionBody.trim(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reply }, { status: 201 });
    }

    // Otherwise create a new discussion thread
    if (!courseId || !title || !discussionBody) {
      return NextResponse.json({ error: "courseId, title, and body are required." }, { status: 400 });
    }

    const { data: discussion, error } = await supabase
      .from("course_discussions")
      .insert({
        course_id: courseId,
        author_id: user.id,
        title: title.trim(),
        body: discussionBody.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ discussion }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
