import Dashboard from "@/components/dashboard/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Course } from "@/types/course";
import { Note } from "@/types/note";

export const dynamic = "force-dynamic";

export default async function Home() {
  let courses: Course[] = [];
  let notes: Note[] = [];

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile = null;

  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileError) {
      profile = profileData;
    }

    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (coursesError) {
      console.error("Error querying courses:", coursesError.message);
    } else {
      courses = coursesData || [];
    }

    // Fetch notes
    const { data: notesData, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Error querying notes:", notesError.message);
    } else {
      notes = notesData || [];
    }
  } catch (err) {
    console.error("Database connection exception:", err);
  }

  const resolvedProfile = profile || {
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
    email: user.email || "student@aura.edu",
    role: "student",
  };

  return (
    <Dashboard 
      initialCourses={courses} 
      initialNotes={notes}
      profile={resolvedProfile}
    />
  );
}
