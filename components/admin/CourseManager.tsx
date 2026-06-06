"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Layers, Check, ShieldAlert, Sparkles, ListVideo, PlaySquare, UploadCloud, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/types/lesson";
import type { Course } from "@/types/course";

interface CourseManagerProps {
  initialCourses: Course[];
  initialLessons: Lesson[];
  currentUserId?: string;
  currentTeacherId?: string;
  currentTeacherName?: string | null;
  mode?: "admin" | "teacher";
}

const colors = ["violet", "cyan", "emerald", "orange"] as const;
const levels = ["Beginner", "Intermediate", "Advanced"] as const;
const icons = ["Atom", "Network", "Sparkles", "Database", "Code", "BookOpen", "Layers"] as const;

export default function CourseManager({
  initialCourses,
  initialLessons,
  currentUserId,
  currentTeacherId,
  currentTeacherName,
  mode = "admin",
}: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourses[0]?.id ?? "");
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);

  const supabase = createClient();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setLevel("Beginner");
    setIconName("BookOpen");
    setTeacherName(mode === "teacher" ? currentTeacherName || "" : "");
    setColor("violet");
    setProgress(0);
    setIsPublished(true);
    setThumbnailUrl("");
    setThumbnailFile(null);
    setThumbnailPreview("");
    setSaveError(null);
    setEditingCourse(null);
  };

  const resetLessonForm = () => {
    setLessonTitle("");
    setLessonDescription("");
    setLessonVideoUrl("");
    setLessonOrder(selectedCourseLessons.length + 1);
    setEditingLesson(null);
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
    setThumbnailUrl(course.thumbnail_url || "");
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail_url || "");
    setSaveError(null);
    setIsModalOpen(true);
  };

  const openAddLessonModal = () => {
    setEditingLesson(null);
    setLessonTitle("");
    setLessonDescription("");
    setLessonVideoUrl("");
    setLessonOrder(selectedCourseLessons.length + 1);
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedCourseId(lesson.course_id);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || "");
    setLessonVideoUrl(lesson.video_url || "");
    setLessonOrder(lesson.lesson_order || 1);
    setIsLessonModalOpen(true);
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailPreview(thumbnailUrl);
    }
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile) {
      return thumbnailUrl.trim() || null;
    }

    const ownerId = currentUserId || currentTeacherId;
    if (!ownerId) {
      throw new Error("A teacher account is required before uploading a course thumbnail.");
    }

    const extension = thumbnailFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${ownerId}/${safeName}`;

    const { error } = await supabase.storage
      .from("course-thumbnails")
      .upload(path, thumbnailFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    let uploadedThumbnailUrl: string | null = null;
    try {
      uploadedThumbnailUrl = await uploadThumbnail();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Thumbnail upload failed.");
      setIsSaving(false);
      return;
    }

    const courseData = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      level,
      icon_name: iconName,
      teacher_name: teacherName.trim() || null,
      color,
      progress,
      is_published: isPublished,
      thumbnail_url: uploadedThumbnailUrl,
      ...(mode === "teacher" && currentTeacherId ? { teacher_id: currentTeacherId } : {}),
    };

    if (editingCourse) {
      // Update operation
      let query = supabase
        .from("courses")
        .update(courseData)
        .eq("id", editingCourse.id);

      if (mode === "teacher" && currentTeacherId) {
        query = query.eq("teacher_id", currentTeacherId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        console.error("Error updating course:", error);
        setSaveError(error.message);
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
        setSaveError(error.message);
      } else if (data) {
        setCourses([...courses, data]);
        setSelectedCourseId(data.id);
        setIsModalOpen(false);
        resetForm();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (courseId: string) => {
    setDeletingCourseId(courseId);
    let query = supabase.from("courses").delete().eq("id", courseId);
    if (mode === "teacher" && currentTeacherId) {
      query = query.eq("teacher_id", currentTeacherId);
    }
    const { error } = await query;

    if (error) {
      console.error("Error deleting course:", error);
    } else {
      setCourses(courses.filter((c) => c.id !== courseId));
      setShowConfirmDelete(null);
    }
    setDeletingCourseId(null);
  };

  const handleSaveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId || !lessonTitle.trim()) return;

    setIsSavingLesson(true);

    const lessonData = {
      course_id: selectedCourseId,
      title: lessonTitle.trim(),
      description: lessonDescription.trim() || null,
      video_url: lessonVideoUrl.trim() || null,
      lesson_order: lessonOrder,
    };

    if (editingLesson) {
      const { data, error } = await supabase
        .from("lessons")
        .update(lessonData)
        .eq("id", editingLesson.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating lesson:", error);
      } else if (data) {
        setLessons(lessons.map((lesson) => (lesson.id === editingLesson.id ? data : lesson)));
        setIsLessonModalOpen(false);
        resetLessonForm();
      }
    } else {
      const { data, error } = await supabase
        .from("lessons")
        .insert([lessonData])
        .select()
        .single();

      if (error) {
        console.error("Error creating lesson:", error);
      } else if (data) {
        setLessons([...lessons, data]);
        setIsLessonModalOpen(false);
        resetLessonForm();
      }
    }

    setIsSavingLesson(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    setDeletingLessonId(lessonId);
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

    if (error) {
      console.error("Error deleting lesson:", error);
    } else {
      setLessons(lessons.filter((lesson) => lesson.id !== lessonId));
    }

    setDeletingLessonId(null);
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedCourseLessons = lessons
    .filter((lesson) => lesson.course_id === selectedCourseId)
    .sort((a, b) => a.lesson_order - b.lesson_order);

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
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-600">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{course.title}</p>
                          <p className="mt-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-violet-400" />
                            Icon: {course.icon_name || "BookOpen"} - Progress: {course.progress}%
                          </p>
                        </div>
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

      {/* Lesson Manager */}
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
        <div className="flex flex-col gap-4 border-b border-white/5 bg-white/[0.01] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <ListVideo className="h-4 w-4 text-cyan-300" />
              Manage Lessons
            </h3>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Add, edit, and order course lessons
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-zinc-950/50 px-4 py-2.5 text-xs font-semibold text-zinc-300 outline-none transition focus:border-cyan-400/40 sm:w-72"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openAddLessonModal}
              disabled={!selectedCourseId}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Lesson
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Lesson</th>
                <th className="px-6 py-4">Video</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedCourseLessons.length > 0 ? (
                selectedCourseLessons.map((lesson) => (
                  <tr key={lesson.id} className="text-zinc-300 transition-colors hover:bg-white/[0.01]">
                    <td className="px-6 py-4">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-[10px] font-black text-cyan-200">
                        {lesson.lesson_order}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{lesson.title}</p>
                      <p className="mt-1 line-clamp-1 max-w-xl text-[10px] font-medium text-zinc-500">
                        {lesson.description || "No description provided."}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {lesson.video_url ? (
                        <a
                          href={lesson.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-cyan-200 transition hover:border-cyan-400/30 hover:text-white"
                        >
                          <PlaySquare className="h-3.5 w-3.5" />
                          Preview
                        </a>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Not added
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditLessonModal(lesson)}
                          className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-2 text-violet-400 transition hover:border-violet-500/25 hover:bg-violet-500/15"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingLessonId === lesson.id}
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="rounded-xl border border-red-500/10 bg-red-500/5 p-2 text-red-400 transition hover:border-red-500/25 hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs font-semibold text-zinc-500">
                    No lessons found for this course. Add the first lesson to build the curriculum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
              {saveError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                  {saveError}
                </div>
              )}

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

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Thumbnail</label>
                <div className="grid gap-3 sm:grid-cols-[112px_1fr] sm:items-center">
                  <div className="flex aspect-video w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 text-zinc-600">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-violet-500/30 hover:text-white">
                    <UploadCloud className="h-4 w-4 text-violet-300" />
                    Upload thumbnail
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleThumbnailChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
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
                    disabled={mode === "teacher"}
                    placeholder="e.g. Dr. Alex Vance"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50 disabled:cursor-not-allowed disabled:text-zinc-500"
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
                {isSaving ? "Saving..." : editingCourse ? "Save Changes" : isPublished ? "Publish Course" : "Save Draft"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Create / Edit Dialog */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-mesh-cyan opacity-25 pointer-events-none" />

            <div className="relative z-10 mb-4 flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
                <ListVideo className="h-4 w-4 text-cyan-300" />
                {editingLesson ? "Edit Lesson" : "Add Lesson"}
              </h3>
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="rounded-xl border border-white/5 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="relative z-10 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-cyan-500/50"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_110px]">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Lesson Title</label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(event) => setLessonTitle(event.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                    placeholder="e.g. Introduction and setup"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lessonOrder}
                    onChange={(event) => setLessonOrder(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Video URL</label>
                <input
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(event) => setLessonVideoUrl(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Description</label>
                <textarea
                  rows={4}
                  value={lessonDescription}
                  onChange={(event) => setLessonDescription(event.target.value)}
                  className="w-full resize-none rounded-xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                  placeholder="What this lesson covers..."
                />
              </div>

              <button
                type="submit"
                disabled={isSavingLesson}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
              >
                {isSavingLesson ? "Saving..." : editingLesson ? "Save Lesson" : "Add Lesson"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
