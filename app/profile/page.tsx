import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { getFullProfileData } from "@/lib/profile/queries";
import StudentProfileView from "@/components/profile/StudentProfileView";
import TeacherProfileView from "@/components/profile/TeacherProfileView";
import AdminProfileView from "@/components/profile/AdminProfileView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AURA | Role-Based Profile",
  description: "Manage your personal information, credentials, learning, and platform settings.",
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/profile");
  }

  const profileData = await getFullProfileData(currentUser.id, currentUser.role);

  if (!profileData) {
    redirect("/login?next=/profile");
  }

  const role = currentUser.role?.toLowerCase();

  if (role === "admin") {
    return <AdminProfileView data={profileData} />;
  }

  if (role === "teacher") {
    return <TeacherProfileView data={profileData} />;
  }

  // Student (Default)
  return <StudentProfileView data={profileData} />;
}
