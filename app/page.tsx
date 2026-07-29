import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getWorkforceDataset } from "@/data-pipeline";

export const metadata = {
  title: "Workforce Pulse | Operations Dashboard",
  description: "Executive-level monitoring of labor leakages, task repetitiveness, and process automation opportunities.",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function Page() {
  const dataset = await getWorkforceDataset();

  return (
    <DashboardView dataset={dataset} />
  );
}
