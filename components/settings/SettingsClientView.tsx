"use client";

import React, { useState } from "react";
import {
  Bell,
  BookOpen,
  Briefcase,
  CreditCard,
  Eye,
  Globe,
  Lock,
  Moon,
  Server,
  Settings,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import SettingsLayout, { SettingsTab } from "./SettingsLayout";
import { UserSettingsResponse } from "@/types/settings";
import AccountSettings from "./AccountSettings";
import AppearanceSettings from "./AppearanceSettings";
import NotificationSettings from "./NotificationSettings";
import PrivacySettings from "./PrivacySettings";
import LanguageSettings from "./LanguageSettings";
import AccessibilitySettings from "./AccessibilitySettings";
import SubscriptionBillingSettings from "./SubscriptionBillingSettings";
import SecuritySettings from "./SecuritySettings";
import StudentSettings from "./StudentSettings";
import TeacherSettings from "./TeacherSettings";
import AdminSettings from "./AdminSettings";

interface SettingsClientViewProps {
  initialData: UserSettingsResponse;
}

export default function SettingsClientView({ initialData }: SettingsClientViewProps) {
  const role = initialData.userRole?.toLowerCase() || "student";

  // Build role-tailored tab navigation
  const tabs: SettingsTab[] = React.useMemo(() => {
    if (role === "teacher") {
      return [
        { id: "account", label: "Account", description: "Manage login credentials and active device sessions", icon: User },
        { id: "teaching", label: "Teaching Preferences", description: "Delivery mode, available mentoring hours, and payouts", icon: Briefcase },
        { id: "appearance", label: "Appearance", description: "Color theme, brand accents, and interface density", icon: Moon },
        { id: "notifications", label: "Notifications", description: "Direct student alerts, reviews, and platform digests", icon: Bell },
        { id: "privacy", label: "Privacy", description: "Public teacher discovery and student visibility permissions", icon: Eye },
        { id: "language", label: "Language & Region", description: "Timezone, preferred currency, and date formats", icon: Globe },
        { id: "accessibility", label: "Accessibility", description: "Contrast enhancements, text scaling, and reduced motion", icon: Sparkles },
        { id: "security", label: "Security", description: "Password updates, 2FA authenticator, and session safeguards", icon: Lock },
      ];
    }

    if (role === "admin") {
      return [
        { id: "account", label: "Account", description: "Administrator profile credentials and office details", icon: User },
        { id: "admin_ops", label: "Platform Operations", description: "Maintenance mode, audit logging levels, and system console", icon: Server },
        { id: "security", label: "Security & MFA", description: "Hardware keys, 2FA, and privileged access safeguards", icon: Lock },
        { id: "appearance", label: "Appearance", description: "Interface themes and console density", icon: Moon },
        { id: "notifications", label: "Notifications", description: "System alerts and maintenance broadcasts", icon: Bell },
        { id: "language", label: "Language & Region", description: "Global date formatting and platform locale", icon: Globe },
        { id: "accessibility", label: "Accessibility", description: "Assistive controls and display adaptations", icon: Sparkles },
      ];
    }

    // Student (Default)
    return [
      { id: "account", label: "Account", description: "Manage login credentials, username, and device sessions", icon: User },
      { id: "learning", label: "Learning Preferences", description: "Daily study targets, reminder alarms, and difficulty level", icon: BookOpen },
      { id: "appearance", label: "Appearance", description: "Theme mode, brand accent color, and layout density", icon: Moon },
      { id: "notifications", label: "Notifications", description: "Course updates, quiz reminder alarms, and email alerts", icon: Bell },
      { id: "privacy", label: "Privacy", description: "Profile visibility, leaderboard exposure, and certificate sharing", icon: Eye },
      { id: "subscription", label: "Subscription & Billing", description: "Active membership plan, renewal cycle, and payment receipts", icon: CreditCard },
      { id: "language", label: "Language & Region", description: "Timezone, date formats, and localized currency", icon: Globe },
      { id: "accessibility", label: "Accessibility", description: "Screen contrast, text scaling, and motion reduction", icon: Sparkles },
      { id: "security", label: "Security", description: "Password change, two-factor authentication, and login history", icon: Lock },
    ];
  }, [role]);

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <SettingsLayout
      userRole={initialData.userRole}
      userFullName={initialData.userFullName}
      userEmail={initialData.userEmail}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* 1. Account Settings */}
      {activeTab === "account" && (
        <AccountSettings
          initialFullName={initialData.userFullName}
          initialEmail={initialData.userEmail}
          initialUsername={initialData.username}
        />
      )}

      {/* 2. Appearance Settings */}
      {activeTab === "appearance" && (
        <AppearanceSettings settings={initialData.settings} />
      )}

      {/* 3. Notification Settings */}
      {activeTab === "notifications" && (
        <NotificationSettings settings={initialData.settings} />
      )}

      {/* 4. Privacy Settings */}
      {activeTab === "privacy" && (
        <PrivacySettings settings={initialData.settings} />
      )}

      {/* 5. Language Settings */}
      {activeTab === "language" && (
        <LanguageSettings settings={initialData.settings} />
      )}

      {/* 6. Accessibility Settings */}
      {activeTab === "accessibility" && (
        <AccessibilitySettings settings={initialData.settings} />
      )}

      {/* 7. Subscription & Billing Settings (Student) */}
      {activeTab === "subscription" && (
        <SubscriptionBillingSettings />
      )}

      {/* 8. Security Settings */}
      {activeTab === "security" && (
        <SecuritySettings />
      )}

      {/* 9. Student Learning Habits (Student) */}
      {activeTab === "learning" && (
        <StudentSettings settings={initialData.settings} />
      )}

      {/* 10. Teacher Preferences (Teacher) */}
      {activeTab === "teaching" && (
        <TeacherSettings settings={initialData.settings} />
      )}

      {/* 11. Admin Operations (Admin) */}
      {activeTab === "admin_ops" && (
        <AdminSettings settings={initialData.settings} />
      )}
    </SettingsLayout>
  );
}
