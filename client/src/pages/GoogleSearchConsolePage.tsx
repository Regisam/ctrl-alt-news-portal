import React from 'react';
import GSCMetricsDashboard from '../components/GSCMetricsDashboard';

export const GoogleSearchConsolePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <GSCMetricsDashboard siteUrl="https://ctrlaltnews.com" refreshInterval={3600000} />
      </div>
    </div>
  );
};

export default GoogleSearchConsolePage;
