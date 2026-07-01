import { AppHeader } from "@/components/ui/AppHeader";
import UserInsightsGlobeSection from "./_components/UserInsightsGlobeSection";

export default function UserInsightsPage() {
  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="User insights navigation" />
      <UserInsightsGlobeSection />
    </main>
  );
}
