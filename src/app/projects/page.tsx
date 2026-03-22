import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/projects");
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-on-surface mb-4">Projects</h1>
        <p className="text-on-surface/60">Your projects will appear here.</p>
      </main>
    </div>
  );
}
