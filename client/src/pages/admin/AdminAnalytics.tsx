import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminRoute } from '../../components/admin/AdminRoute';
import { KPICards } from '../../components/admin/KPICards';
import { TrendingArticles } from '../../components/admin/TrendingArticles';
import { EngagementByCategory } from '../../components/admin/EngagementByCategory';
import { UserGrowthChart } from '../../components/admin/UserGrowthChart';
import { TimeSeriesChart } from '../../components/admin/TimeSeriesChart';
import { Button } from '@/components/ui/button';

interface KPIData {
  views: { today: number; week: number; month: number };
  comments: { today: number; week: number; month: number };
  signups: { today: number; week: number; month: number };
}

export function AdminAnalytics() {
  const [lang] = useState<'en' | 'pt'>('en');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Analytics Dashboard',
      description: 'View real-time metrics, trends, and engagement data',
      export: 'Export CSV',
      lastUpdated: 'Last updated',
    },
    pt: {
      title: 'Painel de Analytics',
      description: 'Ver métricas em tempo real, tendências e dados de engajamento',
      export: 'Exportar CSV',
      lastUpdated: 'Última atualização',
    },
  };

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setKpiData(data.data);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/analytics/export', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  /* eslint-disable */
  useEffect(() => {
    fetchKPIData();
  }, []);
  /* eslint-enable */

  return (
    <AdminRoute>
      <AdminLayout lang={lang}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#00D4FF] mb-2">{t[lang].title}</h1>
              <p className="text-gray-400">{t[lang].description}</p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80"
            >
              {t[lang].export}
            </Button>
          </div>

          {/* KPI Cards */}
          {!loading && kpiData && <KPICards data={kpiData} />}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div>
              <TrendingArticles />
            </div>
            <div>
              <EngagementByCategory />
            </div>
            <div className="lg:col-span-2">
              <UserGrowthChart />
            </div>
            <div className="lg:col-span-2">
              <TimeSeriesChart />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            {t[lang].lastUpdated}: {new Date().toLocaleString()}
          </p>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
