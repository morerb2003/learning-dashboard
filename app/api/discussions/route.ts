import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getCached, setCached, deleteCachedPattern } from "@/lib/cache";

interface ProfileMetadata {
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

interface ReplyRow {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileMetadata | null;
}

interface DiscussionRow {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  body: string;
  is_locked: boolean;
  created_at: string;
  profiles?: ProfileMetadata | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // 1. Check Redis cache
    const cacheKey = `aura:cache:discussions:${courseId || "all"}`;
    const cachedDiscussions = await getCached<unknown[]>(cacheKey);
    if (cachedDiscussions !== null) {
      return NextResponse.json(
        { discussions: cachedDiscussions },
        { headers: { "X-Cache-Lookup": "HIT" } }
      );
    }

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

    const typedDiscussions = (discussions as unknown as DiscussionRow[]) ?? [];
    const discussionIds = typedDiscussions.map((d) => d.id);
    const repliesMap: Record<string, ReplyRow[]> = {};

    if (discussionIds.length > 0) {
      const { data: replies } = await supabase
        .from("discussion_replies")
        .select("id, discussion_id, author_id, body, created_at, profiles(full_name, email, avatar_url, role)")
        .in("discussion_id", discussionIds)
        .order("created_at", { ascending: true });

      const typedReplies = (replies as unknown as ReplyRow[]) ?? [];
      for (const r of typedReplies) {
        if (!repliesMap[r.discussion_id]) {
          repliesMap[r.discussion_id] = [];
        }
        repliesMap[r.discussion_id].push(r);
      }
    }

    const formatted = typedDiscussions.map((d) => ({
      ...d,
      author_name: d.profiles?.full_name || d.profiles?.email?.split("@")[0] || "User",
      replies: repliesMap[d.id] ?? [],
    }));

    // Cache for 30 seconds
    await setCached(cacheKey, formatted, 30);

    return NextResponse.json(
      { discussions: formatted },
      { headers: { "X-Cache-Lookup": "MISS" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Redis Rate Limit: 30 requests / minute / user
    const rateLimitCheck = await checkRateLimit("discussions", user.id || getClientIp(request));
    if (!rateLimitCheck.success) {
      return rateLimitResponse(rateLimitCheck.reset);
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

      // 3. Invalidate discussion caches
      await deleteCachedPattern("aura:cache:discussions:*");

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

    // 3. Invalidate discussion caches
    await deleteCachedPattern("aura:cache:discussions:*");

    return NextResponse.json({ discussion }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
