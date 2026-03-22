import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { listProjects } from "@/lib/db/conversations";
import { ProjectList } from "./project-list";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/projects");
  }

  const projects = await listProjects();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeItem="estimates" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
            <ProjectList projects={projects} />
          </div>
        </main>
        <MobileNav activeTab="estimates" />
      </div>
    </div>
  );
}
