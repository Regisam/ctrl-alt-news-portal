import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CategoryData {
  category: string;
  articles: number;
  views: number;
}

export function EngagementByCategory() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/admin/analytics/by-category', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-[#00D4FF]/20 rounded p-6 h-80 flex items-center justify-center">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#00D4FF]/20 rounded p-6">
      <h3 className="text-lg font-semibold text-[#00D4FF] mb-6">Engagement by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00D4FF/20" />
          <XAxis dataKey="category" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #00D4FF' }}
            labelStyle={{ color: '#00D4FF' }}
          />
          <Legend />
          <Bar dataKey="views" fill="#00D4FF" name="Views" />
          <Bar dataKey="articles" fill="#a78bfa" name="Articles" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
