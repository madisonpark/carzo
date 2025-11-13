import { Suspense } from 'react';
import { CampaignPlanningDashboard } from './components/Dashboard';

export const metadata = {
  title: 'Campaign Planning | Carzo Admin',
  description: 'Plan advertising campaigns based on inventory availability',
};

export default async function CampaignPlanningPage() {
  return (
    <div className="min-h-screen bg-muted p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Campaign Planning Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Plan advertising campaigns based on current inventory availability
          </p>
        </header>

        <Suspense fallback={<div>Loading...</div>}>
          <CampaignPlanningDashboard />
        </Suspense>
      </div>
    </div>
  );
}
