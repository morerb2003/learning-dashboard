"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Layers, Check, ShieldAlert, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  title: string;
  progress: number;
  icon_name: string;
  created_at: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  teacher_name?: string | null;
  color?: string | null;
  is_published?: boolean | null;
}

interface CourseManagerProps {
  initialCourses: Course[];
}

const colors = ["violet", "cyan", "emerald", "orange"] as const;
const levels = ["Beginner", "Intermediate", "Advanced"] as const;
const icons = ["Atom", "Network", "Sparkles", "Database", "Code", "BookOpen", "Layers"] as const;

export default function CourseManager({ initialCourses }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<typeof levels[number]>("Beginner");
  const [iconName, setIconName] = useState<typeof icons[number]>("BookOpen");
  const [teacherName, setTeacherName] = useState("");
  const [color, setColor] = useState<typeof colors[number]>("violet");
  const [progress, setProgress] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  const supabase = createClient();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setLevel("Beginner");
    setIconName("BookOpen");
    setTeacherName("");
    setColor("violet");
    setProgress(0);
    setIsPublished(true);
    setEditingCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description || "");
    setCategory(course.category || "");
    setLevel((course.level as typeof levels[number]) || "Beginner");
    setIconName((course.icon_name as typeof icons[number]) || "BookOpen");
    setTeacherName(course.teacher_name || "");
    setColor((course.color as typeof colors[number]) || "violet");
    setProgress(course.progress || 0);
    setIsPublished(course.is_published !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const courseData = {
      title,
      description,
      category,
      level,
      icon_name: iconName,
      teacher_name: teacherName,
      color,
      progress,
      is_published: isPublished,
    };

    if (editingCourse) {
      // Update operation
      const { data, error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", editingCourse.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating course:", error);
      } else if (data) {
        setCourses(courses.map((c) => (c.id === editingCourse.id ? data : c)));
        setIsModalOpen(false);
        resetForm();
      }
    } else {
      // Create operation
      const { data, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      if (error) {
        console.error("Error creating course:", error);
      } else if (data) {
        setCourses([...courses, data]);
        setIsModalOpen(false);
        resetForm();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (courseId: string) => {
    setDeletingCourseId(courseId);
    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      console.error("Error deleting course:", error);
    } else {
      setCourses(courses.filter((c) => c.id !== courseId));
      setShowConfirmDelete(null);
    }
    setDeletingCourseId(null);
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-zinc-950/40 border border-white/5 rounded-2xl py-2 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors w-full sm:w-80"
        />

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-violet-500/30 rounded-2xl text-xs font-semibold text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* Grid Table */}
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">Title & Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="text-zinc-300 hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white text-sm">{course.title}</p>
                        <p className="mt-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-violet-400" />
                          Icon: {course.icon_name || "BookOpen"} &bull; Progress: {course.progress}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-400">{course.category || "General"}</td>
                    <td className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                      {course.level || "Beginner"}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{course.teacher_name || "Unassigned"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          course.is_published !== false
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                        }`}
                      >
                        {course.is_published !== false ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {showConfirmDelete === course.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Confirm?
                          </span>
                          <button
                            disabled={deletingCourseId === course.id}
                            onClick={() => handleDelete(course.id)}
                            className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(null)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-2 rounded-xl bg-violet-500/5 text-violet-400 border border-violet-500/10 hover:bg-violet-500/15 hover:border-violet-500/25 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(course.id)}
                            className="p-2 rounded-xl bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/25 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    No courses available. Create one to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                {editingCourse ? "Modify Course Profile" : "Create New Course"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-white/5 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="relative z-10 space-y-4 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js App Router Architecture"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed module curriculum overview..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Frontend Architecture"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as typeof levels[number])}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-3 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Icon Representation</label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value as typeof icons[number])}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-3 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
                  >
                    {icons.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lead Instructor</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="e.g. Dr. Alex Vance"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Color Accent</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as typeof colors[number])}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-3 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
                  >
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Initial Progress ({progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full accent-violet-500 h-10 mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5 mt-4">
                <div>
                  <p className="text-xs font-semibold text-white">Publish Immediately</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Toggle catalog visibility state</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                    isPublished ? "bg-violet-600 justify-end" : "bg-zinc-800 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingCourse ? "Save Changes" : "Publish Course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
