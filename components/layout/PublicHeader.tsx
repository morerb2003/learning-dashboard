"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, Menu, X, ArrowRight, Search } from "lucide-react";

interface PublicHeaderProps {
  user?: {
    email: string;
    role?: string;
  } | null;
}

export default function PublicHeader({ user }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-wider text-white text-base">AURA</span>
            <span className="text-[10px] font-semibold text-zinc-500 tracking-widest flex items-center gap-1">
              LMS <Sparkles className="h-2.5 w-2.5 text-violet-400" />
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Courses
          </Link>
          <Link href="/community" className="hover:text-white transition-colors">
            Community
          </Link>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all cursor-pointer"
            >
              Open Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:border-white/20 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950 px-6 py-5 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-zinc-300">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
              Home
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
              Courses
            </Link>
            <Link href="/community" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
              Community
            </Link>
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-white/10 py-2 text-xs font-bold text-zinc-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-violet-600 py-2 text-xs font-bold text-white"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
