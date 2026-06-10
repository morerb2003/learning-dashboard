import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Award, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrintCertificateButton from "@/components/course/PrintCertificateButton";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/course/${id}/certificate`);

  const [courseResult, profileResult, enrollmentResult, certificateResult] =
    await Promise.all([
      supabase.from("courses").select("id, title, teacher_name").eq("id", id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
      supabase
        .from("enrollments")
        .select("progress")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .maybeSingle(),
      supabase
        .from("certificates")
        .select("id, certificate_number, issued_at")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .maybeSingle(),
    ]);

  if (!courseResult.data) notFound();
  if (!enrollmentResult.data || enrollmentResult.data.progress < 100) {
    redirect(`/course/${id}`);
  }

  let certificate = certificateResult.data;
  if (!certificate) {
    const { data, error } = await supabase
      .from("certificates")
      .insert({ user_id: user.id, course_id: id })
      .select("id, certificate_number, issued_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to issue certificate.");
    }
    certificate = data;
  }

  const learnerName =
    profileResult.data?.full_name || profileResult.data?.email || "AURA Learner";

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 print:bg-white print:p-0 print:text-zinc-950 md:p-10">
      <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between print:hidden">
        <Link href={`/course/${id}`} className="text-sm font-bold text-zinc-400 hover:text-white">
          Back to course
        </Link>
        <PrintCertificateButton />
      </div>

      <section className="relative mx-auto flex min-h-[680px] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-amber-300/30 bg-zinc-900 px-8 py-16 text-center shadow-2xl print:min-h-screen print:max-w-none print:rounded-none print:border-8 print:border-amber-500 print:bg-white print:shadow-none">
        <div className="absolute inset-4 rounded-[1.5rem] border border-amber-300/20 print:border-amber-500/40" />
        <Award className="h-16 w-16 text-amber-300 print:text-amber-600" />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.45em] text-amber-300 print:text-amber-700">
          Certificate of Completion
        </p>
        <h1 className="mt-10 text-4xl font-black tracking-tight md:text-6xl">{learnerName}</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 print:text-zinc-600">
          has successfully completed all required lessons in
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-black text-white print:text-zinc-950 md:text-4xl">
          {courseResult.data.title}
        </h2>
        <div className="mt-10 flex items-center gap-2 text-sm font-bold text-emerald-300 print:text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          100% course completion verified
        </div>
        <div className="mt-14 grid w-full max-w-3xl gap-8 border-t border-white/10 pt-8 text-xs print:border-zinc-300 sm:grid-cols-3">
          <div>
            <p className="uppercase tracking-widest text-zinc-500">Issued</p>
            <p className="mt-2 font-bold">
              {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
                new Date(certificate.issued_at)
              )}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-widest text-zinc-500">Instructor</p>
            <p className="mt-2 font-bold">
              {courseResult.data.teacher_name || "AURA Learning"}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-widest text-zinc-500">Certificate ID</p>
            <p className="mt-2 font-mono font-bold">{certificate.certificate_number}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
