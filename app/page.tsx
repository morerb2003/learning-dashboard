import Dashboard from "@/components/dashboard/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  let courses: any[] = [];
  let notes: any[] = [];
  let dbError = false;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (coursesError) {
      console.error("Error querying courses:", coursesError.message);
      dbError = true;
    } else {
      courses = coursesData || [];
    }

    // Fetch notes
    const { data: notesData, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Error querying notes:", notesError.message);
    } else {
      notes = notesData || [];
    }
  } catch (err) {
    console.error("Database connection exception:", err);
    dbError = true;
  }

  return (
    <Dashboard 
      initialCourses={courses} 
      initialNotes={notes}
      dbError={dbError}
      user={user}
    />
  );
}
