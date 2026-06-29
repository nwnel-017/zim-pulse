import Globe from "./_components/globe";
import { AppHeader } from "@/components/ui/AppHeader";

export default function UserInsightsPage() {
  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="User insights navigation" />
      <Globe />
    </main>
  );
}
