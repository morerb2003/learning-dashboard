"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/notification";

export default function NotificationBell() {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (data) setNotifications(data as Notification[]);
  }, [supabase]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      await loadNotifications();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const incoming = payload.new as Notification;
            setNotifications((current) => [
              incoming,
              ...current.filter((item) => item.id !== incoming.id),
            ].slice(0, 12));
          }
        )
        .subscribe();
    };

    void connect();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const markRead = async (id: string) => {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read_at: readAt } : item))
    );
    await supabase.from("notifications").update({ read_at: readAt }).eq("id", id);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id);
    if (unreadIds.length === 0) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? readAt }))
    );
    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .in("id", unreadIds);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-white"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-cyan-300 px-1 text-[9px] font-black text-zinc-950">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-60 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-black text-white">Notifications</p>
              <p className="text-[10px] text-zinc-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const content = (
                  <div
                    className={`border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.04] ${
                      item.read_at ? "opacity-65" : "bg-cyan-500/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          item.read_at ? "bg-zinc-700" : "bg-cyan-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                          {item.message}
                        </p>
                        <p className="mt-1.5 text-[9px] uppercase tracking-wider text-zinc-600">
                          {new Intl.DateTimeFormat("en", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(item.created_at))}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      void markRead(item.id);
                      setIsOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void markRead(item.id)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-10 text-center text-xs text-zinc-500">
                You are all caught up.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
