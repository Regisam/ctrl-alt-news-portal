import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download, Filter, X } from 'lucide-react';
import { useReadingHistory } from '../hooks/useReadingHistory';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReactions } from '../hooks/useReactions';

const CATEGORIES = ['AI', 'Science', 'Robotics', 'Gadgets'];
const CATEGORY_COLORS = {
  AI: '#06b6d4',
  Science: '#a855f7',
  Robotics: '#ef4444',
  Gadgets: '#f97316',
};

interface FilterState {
  startDate: string;
  endDate: string;
  selectedCategories: string[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

function aggregateBookmarksByCategory(
  bookmarks: Array<{ articleId: string; category: string; dateSaved: number }>,
  filter: FilterState
) {
  const filtered = bookmarks.filter(b => {
    const date = formatDate(b.dateSaved);
    const inDateRange = date >= filter.startDate && date <= filter.endDate;
    const inCategory = filter.selectedCategories.length === 0 ||
                      filter.selectedCategories.includes(b.category);
    return inDateRange && inCategory;
  });

  const counts: Record<string, number> = {};
  filtered.forEach(b => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  return CATEGORIES.map(cat => ({
    category: cat,
    bookmarks: counts[cat] || 0,
  })).filter(item => item.bookmarks > 0);
}

function aggregateReactionsByType(
  reactions: Array<{ articleId: string; type: string; timestamp: number }>,
  filter: FilterState
) {
  const filtered = reactions.filter(r => {
    const date = formatDate(r.timestamp);
    return date >= filter.startDate && date <= filter.endDate;
  });

  const counts: Record<string, number> = {};
  filtered.forEach(r => {
    counts[r.type] = (counts[r.type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      reactions: count,
    }))
    .sort((a, b) => b.reactions - a.reactions);
}

function getTopBookmarkedArticles(
  bookmarks: Array<{ articleId: string; title: string; category: string; dateSaved: number }>,
  filter: FilterState
) {
  const filtered = bookmarks.filter(b => {
    const date = formatDate(b.dateSaved);
    const inDateRange = date >= filter.startDate && date <= filter.endDate;
    const inCategory = filter.selectedCategories.length === 0 ||
                      filter.selectedCategories.includes(b.category);
    return inDateRange && inCategory;
  });

  const counts: Record<string, { title: string; category: string; count: number }> = {};
  filtered.forEach(b => {
    if (!counts[b.articleId]) {
      counts[b.articleId] = { title: b.title, category: b.category, count: 0 };
    }
    counts[b.articleId].count += 1;
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      title: item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title,
      bookmarks: item.count,
      fullTitle: item.title,
    }));
}

function getTopReactedArticles(
  reactions: Array<{ articleId: string; timestamp: number }>,
  bookmarks: Array<{ articleId: string; title: string }>,
  filter: FilterState
) {
  const filtered = reactions.filter(r => {
    const date = formatDate(r.timestamp);
    return date >= filter.startDate && date <= filter.endDate;
  });

  const counts: Record<string, number> = {};
  filtered.forEach(r => {
    counts[r.articleId] = (counts[r.articleId] || 0) + 1;
  });

  const bookmarkMap: Record<string, string> = {};
  bookmarks.forEach(b => {
    bookmarkMap[b.articleId] = b.title;
  });

  return Object.entries(counts)
    .map(([articleId, count]) => ({
      title: bookmarkMap[articleId] || `Article ${articleId}`,
      reactions: count,
    }))
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, 5)
    .map(item => ({
      title: item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title,
      reactions: item.reactions,
      fullTitle: item.title,
    }));
}

function getRecentReadingHistory(
  history: Array<{ articleId: string; title: string; category: string; timestamp: number }>,
  filter: FilterState
) {
  return history
    .filter(h => {
      const date = formatDate(h.timestamp);
      const inDateRange = date >= filter.startDate && date <= filter.endDate;
      const inCategory = filter.selectedCategories.length === 0 ||
                        filter.selectedCategories.includes(h.category);
      return inDateRange && inCategory;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
}

export default function EngagementDashboardPage() {
  const { history } = useReadingHistory();
  const { bookmarks } = useBookmarks();
  const { reactions } = useReactions();

  const [filter, setFilter] = useState<FilterState>(() => {
    const today = formatDate(Date.now());
    const thirtyDaysAgo = formatDate(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo,
      endDate: today,
      selectedCategories: [],
    };
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const bookmarksByCategory = useMemo(
    () => aggregateBookmarksByCategory(bookmarks, filter),
    [bookmarks, filter]
  );

  const reactionsByType = useMemo(
    () => aggregateReactionsByType(reactions, filter),
    [reactions, filter]
  );

  const topBookmarkedArticles = useMemo(
    () => getTopBookmarkedArticles(bookmarks, filter),
    [bookmarks, filter]
  );

  const topReactedArticles = useMemo(
    () => getTopReactedArticles(reactions, bookmarks, filter),
    [reactions, bookmarks, filter]
  );

  const recentHistory = useMemo(
    () => getRecentReadingHistory(history, filter),
    [history, filter]
  );

  const handleExportCSV = () => {
    const timestamp = Date.now();
    const csvData = [
      ['Engagement Analytics Report', `Generated: ${new Date(timestamp).toISOString()}`],
      [],
      ['Filters Applied'],
      [`Date Range: ${filter.startDate} to ${filter.endDate}`],
      [`Categories: ${filter.selectedCategories.length === 0 ? 'All' : filter.selectedCategories.join(', ')}`],
      [],
      ['Bookmarks by Category'],
      ['Category', 'Count'],
      ...bookmarksByCategory.map(item => [item.category, item.bookmarks.toString()]),
      [],
      ['Reactions by Type'],
      ['Type', 'Count'],
      ...reactionsByType.map(item => [item.type, item.reactions.toString()]),
      [],
      ['Top Bookmarked Articles'],
      ['Title', 'Bookmarks'],
      ...topBookmarkedArticles.map(item => [item.fullTitle, item.bookmarks.toString()]),
      [],
      ['Top Reacted Articles'],
      ['Title', 'Reactions'],
      ...topReactedArticles.map(item => [item.fullTitle, item.reactions.toString()]),
      [],
      ['Recent Reading History'],
      ['Title', 'Category', 'Date'],
      ...recentHistory.map(item => [
        item.title,
        item.category,
        formatDate(item.timestamp),
      ]),
    ];

    const csvString = csvData.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `engagement-analytics-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Engagement Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize your engagement metrics across all interactions
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros
              </h2>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
              {/* Date Range */}
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Inicial
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={filter.startDate}
                  onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Final
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={filter.endDate}
                  onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Categorias
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(category => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter.selectedCategories.includes(category)}
                      onChange={e => {
                        const updated = e.target.checked
                          ? [...filter.selectedCategories, category]
                          : filter.selectedCategories.filter(c => c !== category);
                        setFilter({ ...filter, selectedCategories: updated });
                      }}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bookmarks by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Favoritos por Categoria
            </h2>
            {bookmarksByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bookmarksByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="bookmarks" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {bookmarksByCategory.map(item => (
                      <Cell
                        key={`cell-${item.category}`}
                        fill={CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>

          {/* Reactions by Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reações por Tipo
            </h2>
            {reactionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reactionsByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="reactions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>

          {/* Top Bookmarked Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Artigos Mais Favoritados
            </h2>
            {topBookmarkedArticles.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topBookmarkedArticles}
                  layout="vertical"
                  margin={{ left: 200 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="title" type="category" width={195} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="bookmarks" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>

          {/* Top Reacted Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Artigos Mais Reagidos
            </h2>
            {topReactedArticles.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topReactedArticles}
                  layout="vertical"
                  margin={{ left: 200 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="title" type="category" width={195} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="reactions" fill="#f97316" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Recent Reading History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de Leitura Recente
          </h2>
          {recentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Artigo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Categoria
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {item.title.length > 50
                          ? item.title.substring(0, 50) + '...'
                          : item.title}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatDate(item.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Nenhum histórico de leitura disponível
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
