import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateNumber = searchParams.get("number");
    const courseId = searchParams.get("courseId");

    const supabase = await createClient();

    // 1. Verification by certificate number (public)
    if (certificateNumber) {
      const { data: cert, error } = await supabase
        .from("certificates")
        .select("id, certificate_number, issued_at, user_id, course_id, courses(id, title, duration, teacher_name), profiles(id, full_name, email)")
        .eq("certificate_number", certificateNumber.trim())
        .maybeSingle();

      if (error || !cert) {
        return NextResponse.json({ error: "Certificate not found or invalid." }, { status: 404 });
      }

      return NextResponse.json({ certificate: cert, verified: true });
    }

    // 2. Otherwise get certificates for the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    let query = supabase
      .from("certificates")
      .select("id, certificate_number, issued_at, course_id, courses(id, title, category, level, duration, teacher_name)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: certificates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certificates: certificates ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
