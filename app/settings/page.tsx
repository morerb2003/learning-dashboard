import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { getUserSettings } from "@/lib/settings/queries";
import SettingsClientView from "@/components/settings/SettingsClientView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AURA | Role-Based Settings & Preferences",
  description: "Configure your account behavior, appearance, notifications, privacy, and role preferences.",
};

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/settings");
  }

  const settingsData = await getUserSettings(currentUser.id);

  if (!settingsData) {
    redirect("/login?next=/settings");
  }

  return <SettingsClientView initialData={settingsData} />;
}
