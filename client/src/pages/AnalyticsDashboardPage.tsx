import React from 'react';
import CombinedAnalyticsDashboard from '../components/CombinedAnalyticsDashboard';

export const AnalyticsDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <CombinedAnalyticsDashboard days={30} />
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
