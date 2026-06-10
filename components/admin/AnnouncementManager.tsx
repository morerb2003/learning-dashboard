"use client";

import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  published_at: string;
};

export default function AnnouncementManager({
  adminId,
  initialAnnouncements,
}: {
  adminId: string;
  initialAnnouncements: Announcement[];
}) {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    const { data, error } = await supabase
      .from("platform_announcements")
      .insert({
        author_id: adminId,
        title: title.trim(),
        body: body.trim(),
        audience,
      })
      .select("id, title, body, audience, published_at")
      .single();
    if (!error && data) {
      setAnnouncements((current) => [data, ...current]);
      setTitle("");
      setBody("");
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
    if (!error) setAnnouncements((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-white">
          <Megaphone className="h-4 w-4 text-cyan-300" />
          Publish Platform Update
        </h2>
        <select
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs"
        >
          <option value="all">Everyone</option>
          <option value="students">Students</option>
          <option value="teachers">Teachers</option>
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Announcement title"
          className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder="Platform update..."
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
        <button
          onClick={publish}
          className="mt-3 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-zinc-950"
        >
          Publish Announcement
        </button>
      </section>

      <section className="space-y-3">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-violet-300">
                  {announcement.audience}
                </span>
                <h2 className="mt-2 text-base font-black">{announcement.title}</h2>
              </div>
              <button onClick={() => void remove(announcement.id)} className="text-zinc-600 hover:text-rose-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{announcement.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
