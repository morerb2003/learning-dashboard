"use client";

import React, { useState } from "react";
import { Search, Trash2, ShieldAlert, Check, X, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "student" | "pending_teacher" | "teacher" | "admin";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at: string;
}

interface UserTableProps {
  initialUsers: UserProfile[];
}

const roleStyles: Record<Role, string> = {
  student: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  pending_teacher: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  teacher: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  admin: "border-red-500/20 bg-red-500/10 text-red-300",
};

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingUserId(userId);
    setStatusMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user role:", error);
      setStatusMessage({ type: "error", text: `Failed to update role: ${error.message}` });
    } else {
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setStatusMessage({ type: "success", text: "User role updated successfully!" });
    }
    setUpdatingUserId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    setStatusMessage(null);

    // Call secure Postgres function to delete auth user (which cascades to profile)
    const { error } = await supabase.rpc("delete_user_by_admin", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error deleting user:", error);
      setStatusMessage({ type: "error", text: `Failed to delete user: ${error.message}` });
    } else {
      setUsers(users.filter((u) => u.id !== userId));
      setStatusMessage({ type: "success", text: "User deleted successfully!" });
    }
    setDeletingUserId(null);
    setShowConfirmDelete(null);
  };

  // Filter & Search users
  const filteredUsers = users.filter((user) => {
    const displayName = user.full_name || user.email?.split("@")[0] || "Unnamed user";
    const matchesSearch =
      `${displayName} ${user.email ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" ? true : user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-zinc-950/40 border border-white/5 rounded-2xl py-2 px-4 text-xs font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="pending_teacher">Pending Teachers</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Table Grid */}
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Role Assignment</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const displayName = user.full_name || user.email?.split("@")[0] || "Unnamed user";
                  const isDeletable = true;

                  return (
                    <tr key={user.id} className="text-zinc-300 hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{displayName}</p>
                            <p className="mt-0.5 text-[10px] text-zinc-500 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                            roleStyles[user.role] || roleStyles.student
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={updatingUserId === user.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className="bg-zinc-950/40 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-zinc-300 outline-none focus:border-violet-500/50 disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="pending_teacher">Pending Teacher</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-semibold">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {showConfirmDelete === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Confirm?
                            </span>
                            <button
                              disabled={deletingUserId === user.id}
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                              title="Yes, delete"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowConfirmDelete(null)}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={!isDeletable}
                            onClick={() => setShowConfirmDelete(user.id)}
                            className="p-2 rounded-xl bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            title="Delete user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    No users found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
