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

  try {
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

    // Handle Snapshot Response
    let snapshot = { total_vehicles: 0, by_body_style: {}, by_make: {} };
    if (snapshotResponse.ok) {
      snapshot = await snapshotResponse.json();
    } else {
      console.error(
        "Failed to fetch inventory snapshot:",
        snapshotResponse.status,
        await snapshotResponse.text()
      );
    }

    // Handle Combinations Response
    let combinations = { make_bodystyle: [], make_model: [] };
    if (combinationsResponse.ok) {
      combinations = await combinationsResponse.json();
    } else {
      console.error(
        "Failed to fetch combinations:",
        combinationsResponse.status,
        await combinationsResponse.text()
      );
    }

    return { snapshot, combinations };
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    // Return safe fallback data so the page doesn't crash
    return {
      snapshot: {
        total_vehicles: 0,
        by_body_style: {},
        by_make: {}
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
