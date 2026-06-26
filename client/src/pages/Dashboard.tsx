import { DashboardMetrics } from '../components/DashboardMetrics';
import { AlertsDisplay } from '../components/AlertsDisplay';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-12">Analytics Dashboard</h1>

        {/* Metrics Section */}
        <section className="mb-16">
          <DashboardMetrics />
        </section>

        {/* Alerts Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">System Health</h2>
          <AlertsDisplay />
        </section>
      </div>
    </div>
  );
}
