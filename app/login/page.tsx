import LoginForm from "@/components/auth/LoginForm";
import { GraduationCap, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none mix-blend-screen" />
      <div className="grain-overlay" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 glass-card rounded-[2rem] mx-4 flex flex-col items-center">
        {/* Branding Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20 ring-1 ring-white/10">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 mb-2">
          AURA Portal
          <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
        </h1>
        
        <p className="text-sm text-zinc-400 text-center mb-10 font-medium max-w-[280px]">
          Sign in to access your courses, personalized analytics, and study notes.
        </p>

        {/* Action Area */}
        <div className="w-full">
          <LoginForm />
        </div>

        <p className="mt-8 text-[11px] text-zinc-500 font-medium tracking-wide">
          SECURE CONNECTION &bull; AURA EDU
        </p>
      </div>
    </main>
  );
}
