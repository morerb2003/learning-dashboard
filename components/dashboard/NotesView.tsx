"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Trash2, Send } from "lucide-react";
import { Note } from "@/types/note";
import { createClient } from "@/lib/supabase/client";

interface NotesViewProps {
  initialNotes: Note[];
}

export default function NotesView({ initialNotes }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    
    const newNotePartial = {
      title,
      content,
    };

    const { data, error } = await supabase
      .from("notes")
      .insert([newNotePartial])
      .select()
      .single();

    if (!error && data) {
      setNotes([data, ...notes]);
      setTitle("");
      setContent("");
    } else {
      console.error("Failed to add note:", error);
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteNote = async (id: string) => {
    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== id));

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete note:", error);
      setNotes(previousNotes);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-cyan opacity-30 pointer-events-none" />
          <div className="grain-overlay" />
          
          <h3 className="relative z-10 text-sm font-bold text-white mb-4 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-cyan-400" /> Quick Note
          </h3>
          
          <form onSubmit={handleAddNote} className="relative z-10 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Note Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic or Idea..."
                className="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Details</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write down your thoughts..."
                rows={4}
                className="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold hover:bg-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> 
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
          </form>
        </div>
      </div>

      {/* Notes List Section */}
      <div className="lg:col-span-2">
        {notes.length === 0 ? (
          <div className="glass-card h-full min-h-[300px] rounded-3xl flex flex-col items-center justify-center text-center p-8 border border-white/5 bg-zinc-900/20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
              <StickyNote className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-sm font-bold text-white">No Notes Yet</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-sm">Jot down important study concepts or reminders here. They will sync securely to your dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card p-5 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="absolute inset-0 bg-mesh-cyan opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity" />
                  <div className="relative z-10 flex items-start justify-between">
                    <h4 className="text-sm font-bold text-white mb-2">{note.title}</h4>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer -mt-1 -mr-1"
                      aria-label="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="relative z-10 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="relative z-10 text-[9px] text-zinc-600 mt-4 font-medium uppercase tracking-wider">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
