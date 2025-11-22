import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CampaignPlanningDashboard } from "./components/Dashboard";
import { getCachedInventorySnapshot, getCachedCombinations } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campaign Planning | Carzo Admin",
  description: "Plan advertising campaigns based on inventory availability",
};

async function fetchInventoryData() {
  try {
    // Fetch data directly from database (server-side)
    const [snapshot, combinations] = await Promise.all([
      getCachedInventorySnapshot(),
      getCachedCombinations(),
    ]);

    return { snapshot, combinations };
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    // Return safe fallback data so the page doesn't crash
    return {
      snapshot: {
        total_vehicles: 0,
        total_dealers: 0,
        by_metro: {},
        by_body_style: {},
        by_make: {},
        updated_at: new Date().toISOString()
      },
      combinations: {
        make_bodystyle: [],
        make_model: []
      }
    };
  }
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
