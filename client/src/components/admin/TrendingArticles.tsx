import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  views: number;
  comments: number;
}

interface TrendingArticlesProps {
  onWindowChange?: (window: string) => void;
}

export function TrendingArticles({ onWindowChange }: TrendingArticlesProps) {
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('24h');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/admin/analytics/trending?window=${window}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setArticles(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching trending articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [window]);

  const handleWindowChange = (value: string) => {
    setWindow(value);
    onWindowChange?.(value);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#00D4FF]/20 rounded p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#00D4FF] flex items-center gap-2">
          <TrendingUp size={20} /> Top Articles
        </h3>
        <Select value={window} onValueChange={handleWindowChange}>
          <SelectTrigger className="w-32 bg-[#111] border-[#00D4FF]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#00D4FF]/20">
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No articles found</div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, idx) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#00D4FF]/10 hover:border-[#00D4FF]/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[#00D4FF] font-bold w-6">#{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{article.title}</p>
                    <p className="text-xs text-gray-500">{article.slug}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#00D4FF]">{article.views}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-400">{article.comments}</p>
                  <p className="text-xs text-gray-500">comments</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
