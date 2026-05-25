import Dashboard from "@/components/dashboard/Dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  let courses: any[] = [];
  let dbError = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error querying courses:", error.message);
      dbError = true;
    } else {
      courses = data || [];
    }
  } catch (err) {
    console.error("Database connection exception:", err);
    dbError = true;
  }

  return (
    <Dashboard 
      initialCourses={courses} 
      dbError={dbError} 
    />
  );
}
