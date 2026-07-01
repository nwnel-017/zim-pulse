import UserInsightsGlobeSection from "@/app/dashboard/user-insights/_components/UserInsightsGlobeSection";
import { AppHeader } from "@/components/ui/AppHeader";
import { requireAdminSession } from "@/lib/auth/middleware";

export default async function AdminGlobePage() {
  await requireAdminSession();

  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Admin globe navigation" />
      <UserInsightsGlobeSection />
    </main>
  );
}
