import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CampaignPlanningDashboard } from "./components/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campaign Planning | Carzo Admin",
  description: "Plan advertising campaigns based on inventory availability",
};

async function fetchInventoryData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [snapshotResponse, combinationsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/admin/inventory-snapshot`, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_PASSWORD}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/admin/combinations`, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_PASSWORD}` },
      cache: "no-store",
    }),
  ]);

  const snapshot = await snapshotResponse.json();
  const combinations = await combinationsResponse.json();

  return { snapshot, combinations };
}

export default async function CampaignPlanningPage() {
  // Check authentication (server-side)
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("carzo_admin_auth");

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  // Fetch data server-side (password never exposed to client)
  const data = await fetchInventoryData();

  return <CampaignPlanningDashboard initialData={data} />;
}
