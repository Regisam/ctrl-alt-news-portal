import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GrowthData {
  date: string;
  signups: number;
}

export function UserGrowthChart() {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/admin/analytics/user-growth', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching user growth:', error);
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
      <h3 className="text-lg font-semibold text-[#00D4FF] mb-6">User Growth (30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#00D4FF/20" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #00D4FF' }}
            labelStyle={{ color: '#00D4FF' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="signups"
            stroke="#00D4FF"
            name="Signups"
            dot={{ fill: '#00D4FF', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
