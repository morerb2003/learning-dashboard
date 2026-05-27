"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    
    await supabase.auth.signOut();
    
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 rounded-xl bg-zinc-900/80 px-3 py-1.5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-[11px] font-bold text-zinc-300 hover:text-red-400 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      title="Secure Logout"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{isLoggingOut ? "..." : "Logout"}</span>
    </button>
  );
}
