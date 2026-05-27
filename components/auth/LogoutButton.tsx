"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl bg-red-500 px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}
