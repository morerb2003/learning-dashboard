"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Flag,
  MessageCircle,
  MessagesSquare,
  Plus,
  Reply,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Contact = { id: string; full_name: string | null; role: string };
type CourseOption = { id: string; title: string };
type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
type Discussion = {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  body: string;
  is_locked: boolean;
  created_at: string;
};
type DiscussionReply = {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  created_at: string;
};
type Announcement = {
  id: string;
  author_id: string;
  course_id: string | null;
  title: string;
  body: string;
  audience: string;
  published_at: string;
};

interface CommunityWorkspaceProps {
  currentUser: Contact;
  contacts: Contact[];
  courses: CourseOption[];
  initialMessages: DirectMessage[];
  initialDiscussions: Discussion[];
  initialReplies: DiscussionReply[];
  initialAnnouncements: Announcement[];
}

export default function CommunityWorkspace({
  currentUser,
  contacts,
  courses,
  initialMessages,
  initialDiscussions,
  initialReplies,
  initialAnnouncements,
}: CommunityWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"announcements" | "messages" | "forums">("announcements");
  const [messages, setMessages] = useState(initialMessages);
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [replies, setReplies] = useState(initialReplies);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id ?? "");
  const [messageBody, setMessageBody] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionBody, setDiscussionBody] = useState("");
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const canPublish = currentUser.role === "teacher" || currentUser.role === "admin";
  const nameById = new Map([
    [currentUser.id, currentUser.full_name || "You"],
    ...contacts.map((contact) => [
      contact.id,
      contact.full_name || `${contact.role} user`,
    ] as const),
  ]);
  const courseById = new Map(courses.map((course) => [course.id, course.title]));

  useEffect(() => {
    const channel = supabase
      .channel(`community-messages:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const incoming = payload.new as DirectMessage;
          if (
            incoming.sender_id === currentUser.id ||
            incoming.recipient_id === currentUser.id
          ) {
            setMessages((current) => [
              ...current.filter((item) => item.id !== incoming.id),
              incoming,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUser.id, supabase]);

  const conversation = messages
    .filter(
      (message) =>
        (message.sender_id === currentUser.id &&
          message.recipient_id === selectedContactId) ||
        (message.sender_id === selectedContactId &&
          message.recipient_id === currentUser.id)
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const sendMessage = async () => {
    if (!selectedContactId || !messageBody.trim()) return;
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUser.id,
        recipient_id: selectedContactId,
        body: messageBody.trim(),
      })
      .select()
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }
    setMessages((current) => [...current, data as DirectMessage]);
    setMessageBody("");
  };

  const createDiscussion = async () => {
    if (!selectedCourseId || !discussionTitle.trim() || !discussionBody.trim()) return;
    const { data, error } = await supabase
      .from("course_discussions")
      .insert({
        course_id: selectedCourseId,
        author_id: currentUser.id,
        title: discussionTitle.trim(),
        body: discussionBody.trim(),
      })
      .select()
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }
    setDiscussions((current) => [data as Discussion, ...current]);
    setDiscussionTitle("");
    setDiscussionBody("");
  };

  const addReply = async (discussionId: string) => {
    const body = replyBodies[discussionId]?.trim();
    if (!body) return;
    const { data, error } = await supabase
      .from("discussion_replies")
      .insert({
        discussion_id: discussionId,
        author_id: currentUser.id,
        body,
      })
      .select()
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }
    setReplies((current) => [...current, data as DiscussionReply]);
    setReplyBodies((current) => ({ ...current, [discussionId]: "" }));
  };

  const reportContent = async (
    contentType: "discussion" | "reply" | "message",
    contentId: string
  ) => {
    const reason = window.prompt("Why should this content be reviewed?");
    if (!reason?.trim()) return;

    const { error } = await supabase.from("moderation_flags").insert({
      reporter_id: currentUser.id,
      content_type: contentType,
      content_id: contentId,
      reason: reason.trim(),
    });
    setStatus(error ? error.message : "Content reported for review.");
  };

  const publishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    const courseScoped = currentUser.role === "teacher";
    const { data, error } = await supabase
      .from("platform_announcements")
      .insert({
        author_id: currentUser.id,
        course_id: courseScoped ? selectedCourseId : null,
        audience: courseScoped ? "course" : "all",
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
      })
      .select()
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }
    setAnnouncements((current) => [data as Announcement, ...current]);
    setAnnouncementTitle("");
    setAnnouncementBody("");
  };

  const tabs = [
    { id: "announcements" as const, label: "Announcements", icon: BellRing },
    { id: "messages" as const, label: "Messages", icon: MessageCircle },
    { id: "forums" as const, label: "Course Forums", icon: MessagesSquare },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
            AURA Community
          </p>
          <h1 className="mt-2 text-3xl font-black">Communication Center</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Messages, course discussions, and important announcements in one place.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold ${
                  tab === item.id
                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {status && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-200">
            {status}
          </div>
        )}

        {tab === "announcements" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {canPublish && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-black text-white">Publish announcement</h2>
                {currentUser.role === "teacher" && (
                  <select
                    value={selectedCourseId}
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                    className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                )}
                <input
                  value={announcementTitle}
                  onChange={(event) => setAnnouncementTitle(event.target.value)}
                  placeholder="Announcement title"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                />
                <textarea
                  value={announcementBody}
                  onChange={(event) => setAnnouncementBody(event.target.value)}
                  placeholder="Share an update..."
                  rows={5}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={publishAnnouncement}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-zinc-950"
                >
                  <Send className="h-4 w-4" />
                  Publish
                </button>
              </section>
            )}
            <section className="space-y-3">
              {announcements.map((item) => (
                <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-black text-white">{item.title}</h2>
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold uppercase text-violet-300">
                      {item.course_id ? courseById.get(item.course_id) || "Course" : item.audience}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{item.body}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">
                    {new Date(item.published_at).toLocaleString()}
                  </p>
                </article>
              ))}
              {announcements.length === 0 && <p className="text-sm text-zinc-500">No announcements yet.</p>}
            </section>
          </div>
        )}

        {tab === "messages" && (
          <div className="grid min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] md:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 p-3 md:border-b-0 md:border-r">
              <p className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Contacts</p>
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`mt-1 w-full rounded-2xl px-3 py-3 text-left ${
                    selectedContactId === contact.id ? "bg-violet-500/15" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-xs font-bold text-white">{contact.full_name || "AURA User"}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-500">{contact.role}</p>
                </button>
              ))}
              {contacts.length === 0 && <p className="px-2 py-6 text-xs text-zinc-500">No course contacts yet.</p>}
            </aside>
            <section className="flex min-h-[500px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`group flex ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      message.sender_id === currentUser.id
                        ? "bg-violet-500 text-white"
                        : "border border-white/10 bg-white/[0.04] text-zinc-300"
                    }`}>
                      <p>{message.body}</p>
                      <button
                        onClick={() => reportContent("message", message.id)}
                        className="mt-2 hidden items-center gap-1 text-[9px] opacity-60 group-hover:inline-flex"
                      >
                        <Flag className="h-3 w-3" /> Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 p-4">
                <input
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void sendMessage();
                  }}
                  placeholder="Write a message..."
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none"
                />
                <button onClick={sendMessage} className="rounded-2xl bg-violet-500 px-4 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "forums" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="flex items-center gap-2 text-sm font-black"><Plus className="h-4 w-4" /> New discussion</h2>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs"
              >
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <input
                value={discussionTitle}
                onChange={(event) => setDiscussionTitle(event.target.value)}
                placeholder="Discussion title"
                className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <textarea
                value={discussionBody}
                onChange={(event) => setDiscussionBody(event.target.value)}
                placeholder="Ask a question or start a conversation..."
                rows={5}
                className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button onClick={createDiscussion} className="mt-3 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-zinc-950">
                Post discussion
              </button>
            </section>
            <section className="space-y-4">
              {discussions.map((discussion) => {
                const discussionReplies = replies.filter((reply) => reply.discussion_id === discussion.id);
                return (
                  <article key={discussion.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300">
                          {courseById.get(discussion.course_id) || "Course forum"}
                        </p>
                        <h2 className="mt-2 text-lg font-black">{discussion.title}</h2>
                        <p className="mt-1 text-[10px] text-zinc-600">
                          {nameById.get(discussion.author_id) || "Course member"}
                        </p>
                      </div>
                      <button onClick={() => reportContent("discussion", discussion.id)} className="text-zinc-600 hover:text-rose-300">
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{discussion.body}</p>
                    <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                      {discussionReplies.map((reply) => (
                        <div key={reply.id} className="rounded-2xl bg-zinc-950/50 p-3">
                          <div className="flex justify-between gap-3">
                            <p className="text-[10px] font-bold text-zinc-300">{nameById.get(reply.author_id) || "Course member"}</p>
                            <button onClick={() => reportContent("reply", reply.id)} className="text-zinc-700 hover:text-rose-300">
                              <Flag className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-zinc-400">{reply.body}</p>
                        </div>
                      ))}
                      {!discussion.is_locked && (
                        <div className="flex gap-2">
                          <input
                            value={replyBodies[discussion.id] ?? ""}
                            onChange={(event) => setReplyBodies((current) => ({ ...current, [discussion.id]: event.target.value }))}
                            placeholder="Write a reply..."
                            className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs"
                          />
                          <button onClick={() => addReply(discussion.id)} className="rounded-xl bg-white/10 px-3 text-cyan-200">
                            <Reply className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
