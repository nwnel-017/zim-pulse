import Globe from "@/app/dashboard/user-insights/_components/globe";
import { AppHeader } from "@/components/ui/AppHeader";
import { requireAdminSession } from "@/lib/auth/middleware";

export default async function AdminGlobePage() {
  await requireAdminSession();

  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Admin globe navigation" />
      <Globe />
    </main>
  );
}
