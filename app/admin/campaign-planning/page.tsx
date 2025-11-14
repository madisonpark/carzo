import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CampaignPlanningDashboard } from './components/Dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Campaign Planning | Carzo Admin',
  description: 'Plan advertising campaigns based on inventory availability',
};

export default async function CampaignPlanningPage() {
  // Check authentication (server-side)
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('carzo_admin_auth');

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  return <CampaignPlanningDashboard />;
}
