"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Sparkles, Menu, X, ArrowRight } from "lucide-react";

interface PublicHeaderProps {
  user?: {
    email: string;
    role?: string;
  } | null;
}

export default function PublicHeader({ user }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-xl shadow-black/40 py-2"
          : "border-b border-white/5 bg-transparent backdrop-blur-md py-3"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-lg shadow-violet-500/25 group-hover:scale-105 group-hover:shadow-violet-500/40 transition-all duration-300">
            <GraduationCap className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-wider text-white text-base leading-tight">
              AURA
            </span>
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest flex items-center gap-1">
              LMS <Sparkles className="h-2.5 w-2.5 text-violet-400" />
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 backdrop-blur-xl text-sm font-medium text-zinc-300">
          {[
            { href: "/", label: "Home" },
            { href: "/dashboard", label: "Courses" },
            { href: "/community", label: "Community" },
            { href: "#features", label: "Features" },
            { href: "#why-aura", label: "Why AURA" },
            { href: "#faq", label: "FAQ" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative px-3.5 py-1.5 rounded-full text-zinc-300 transition-all duration-200 hover:text-white hover:bg-white/8 text-xs font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Link
              href={
                user.role === "admin"
                  ? "/admin"
                  : user.role === "teacher"
                  ? "/teacher"
                  : "/dashboard"
              }
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer border border-violet-400/30"
            >
              Open Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-zinc-300 hover:border-white/25 hover:bg-white/8 hover:text-white active:scale-[0.97] transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 px-4 py-2 text-xs font-black text-zinc-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer with Fluid Motion */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="md:hidden border-b border-white/10 bg-zinc-950/95 backdrop-blur-2xl px-6 py-5 overflow-hidden"
          >
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-zinc-300">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Courses
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Community
              </Link>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                Features
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white py-1"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5 mt-4">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-white/10 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-cyan-500/20"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
