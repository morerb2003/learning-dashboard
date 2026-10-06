import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { CACHE_KEYS, getCached, setCached, deleteCachedPattern } from "@/lib/cache";

interface CourseListResponse {
  courses: unknown[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 1. Check Redis cache
    const cacheKey = CACHE_KEYS.courseList(searchParams.toString());
    const cachedData = await getCached<CourseListResponse>(cacheKey);
    if (cachedData !== null) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache-Lookup": "HIT" },
      });
    }

    const supabase = await createClient();

    let query = supabase
      .from("courses")
      .select("id, title, description, category, level, duration, teacher_name, progress, is_published, icon_name, created_at, price_cents, is_pro", {
        count: "exact",
      })
      .or("is_published.eq.true,is_published.is.null")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (level && level !== "all") {
      query = query.eq("level", level);
    }
    if (search && search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    const { data: courses, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result: CourseListResponse = {
      courses: courses ?? [],
      total: count ?? 0,
      limit,
      offset,
    };

    // Cache course lists for 5 minutes (300s)
    await setCached(cacheKey, result, 300);

    return NextResponse.json(result, {
      headers: { "X-Cache-Lookup": "MISS" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Teacher or Admin role required." }, { status: 403 });
    }

    // Rate limit course creation: 60/min
    const limitCheck = await checkRateLimit("generalApi", user.id || getClientIp(request));
    if (!limitCheck.success) {
      return rateLimitResponse(limitCheck.reset);
    }

    const body = await request.json();
    const { title, description, category, level, duration, price_cents, is_pro, is_published } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Course title is required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "General",
        level: level || "All Levels",
        duration: duration || "1h 00m",
        teacher_id: user.id,
        teacher_name: user.full_name || user.email?.split("@")[0] || "Instructor",
        price_cents: typeof price_cents === "number" ? price_cents : 0,
        is_pro: Boolean(is_pro),
        is_published: typeof is_published === "boolean" ? is_published : false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate course list cache
    await deleteCachedPattern("aura:cache:courses:list:*");

    return NextResponse.json({ course }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
