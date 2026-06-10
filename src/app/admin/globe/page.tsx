import Globe from "@/app/dashboard/user-insights/_components/globe";
import { requireAdminSession } from "@/lib/auth/middleware";

export default async function AdminGlobePage() {
  await requireAdminSession();

  return <Globe />;
}
