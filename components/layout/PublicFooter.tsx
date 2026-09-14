import React from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, Heart } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20">
                <GraduationCap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-black text-white text-base tracking-wider">AURA</span>
            </Link>
            <p className="max-w-sm text-zinc-400 text-xs leading-relaxed">
              Empowering students, teachers, and teams with an intuitive, modern learning experience, verified certificates, and rich real-time analytics.
            </p>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Platform</p>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Courses</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              <li><Link href="/learning/quizzes" className="hover:text-white transition-colors">Quizzes</Link></li>
              <li><Link href="/learning/assignments" className="hover:text-white transition-colors">Assignments</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Company</p>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Teach on AURA</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Col 4: Support & Legal */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Support</p>
            <ul className="space-y-2">
              <li><Link href="/settings" className="hover:text-white transition-colors">Account Settings</Link></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Help & FAQ</a></li>
              <li><span className="text-zinc-600">Privacy Policy</span></li>
              <li><span className="text-zinc-600">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} AURA Learning Dashboard. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high performance and visual excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
