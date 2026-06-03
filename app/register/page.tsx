import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start learning today"
      subtitle="Choose your role, verify your email, and enter a workspace built for focused learning."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
