import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import LandingView from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AURA | Learn Smarter. Teach Better.",
  description:
    "A modern learning platform for courses, quizzes, assignments, certificates, analytics, and community collaboration.",
};

function roleDestination(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/learning";
}

export default async function LandingPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(roleDestination(currentUser.role));
  }

  return <LandingView />;
}
