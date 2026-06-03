import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Continue your learning"
      subtitle="Log in to access courses, smart notes, progress analytics, and your personalized LMS workspace."
    >
      <LoginForm />
    </AuthLayout>
  );
}
