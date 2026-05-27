"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="rounded-2xl bg-white px-6 py-3 text-black"
    >
      Continue with Google
    </button>
  );
}
