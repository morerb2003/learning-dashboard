import test from "node:test";
import assert from "node:assert/strict";
import { defaultUserSettings, sanitizeSettingsByRole } from "../lib/settings/defaults.ts";

test("defaultUserSettings generates standard defaults for a new user", () => {
  const userId = "11111111-1111-1111-1111-111111111111";
  const defaults = defaultUserSettings(userId);

  assert.equal(defaults.user_id, userId);
  assert.equal(defaults.theme, "dark");
  assert.equal(defaults.accent_color, "violet");
  assert.equal(defaults.layout_density, "comfortable");
  assert.equal(defaults.profile_visibility, "public");
  assert.equal(defaults.email_notifications, true);
  assert.equal(defaults.in_app_notifications, true);
  assert.equal(defaults.daily_study_target_minutes, 30);
  assert.equal(defaults.teaching_available_hours, 20);
  assert.equal(defaults.preferred_payout_method, "bank_transfer");
});

test("settings sanitization strips privileged fields from students", () => {
  const studentPayload: Record<string, any> = {
    theme: "dark",
    daily_study_target_minutes: 45,
    maintenance_notifications: false,
    audit_logging_level: "verbose",
    teaching_mode: "offline",
    payout_notification_threshold: 500,
  };

  const sanitized = sanitizeSettingsByRole(studentPayload, "student");

  assert.equal(sanitized.theme, "dark");
  assert.equal(sanitized.daily_study_target_minutes, 45);
  assert.equal(sanitized.maintenance_notifications, undefined);
  assert.equal(sanitized.audit_logging_level, undefined);
  assert.equal(sanitized.teaching_mode, undefined);
  assert.equal(sanitized.payout_notification_threshold, undefined);
});

test("settings sanitization permits teacher fields for teachers but blocks admin fields", () => {
  const teacherPayload: Record<string, any> = {
    teaching_mode: "hybrid",
    teaching_available_hours: 25,
    student_capacity: 500,
    maintenance_notifications: false,
    audit_logging_level: "verbose",
  };

  const sanitized = sanitizeSettingsByRole(teacherPayload, "teacher");

  assert.equal(sanitized.teaching_mode, "hybrid");
  assert.equal(sanitized.teaching_available_hours, 25);
  assert.equal(sanitized.student_capacity, 500);
  assert.equal(sanitized.maintenance_notifications, undefined);
  assert.equal(sanitized.audit_logging_level, undefined);
});

test("settings sanitization permits admin fields for admins", () => {
  const adminPayload: Record<string, any> = {
    maintenance_notifications: true,
    audit_logging_level: "verbose",
    student_capacity: 1000,
  };

  const sanitized = sanitizeSettingsByRole(adminPayload, "admin");

  assert.equal(sanitized.maintenance_notifications, true);
  assert.equal(sanitized.audit_logging_level, "verbose");
  assert.equal(sanitized.student_capacity, 1000);
});

