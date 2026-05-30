import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { GraduationCap, Sparkles } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh-cyan opacity-20 mix-blend-screen pointer-events-none" />
      <div className="grain-overlay" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[2rem] p-8 md:p-10 glass-card">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/20 ring-1 ring-white/10">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>

        <h1 className="mb-2 flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
          Reset Password
          <Sparkles className="h-5 w-5 animate-pulse text-violet-400" />
        </h1>

        <p className="mb-8 max-w-[300px] text-center text-sm font-medium text-zinc-400">
          Create a new password for your AURA account.
        </p>

        <ResetPasswordForm />
      </div>
    </main>
  );
}
