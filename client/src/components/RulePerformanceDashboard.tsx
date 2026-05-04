import React, { useEffect, useState } from 'react';
import type { Rule } from '@/lib/rules-engine';

interface RulePerformanceData extends Rule {
  ctr?: number; // Click-through rate
}

interface Props {
  rules: Rule[];
  compact?: boolean; // Show minimal version
}

/**
 * Dashboard to track rule performance
 * Shows firing count, impressions, clicks, and CTR for each rule
 */
export function RulePerformanceDashboard({ rules, compact = false }: Props) {
  const [sortBy, setSortBy] = useState<'firing_count' | 'ctr' | 'impressions'>('firing_count');

  const sortedRules = [...rules].sort((a, b) => {
    switch (sortBy) {
      case 'firing_count':
        return b.metadata.firing_count - a.metadata.firing_count;
      case 'ctr':
        const ctrA = a.metadata.impressions > 0
          ? (a.metadata.clicks / a.metadata.impressions) * 100
          : 0;
        const ctrB = b.metadata.impressions > 0
          ? (b.metadata.clicks / b.metadata.impressions) * 100
          : 0;
        return ctrB - ctrA;
      case 'impressions':
        return b.metadata.impressions - a.metadata.impressions;
      default:
        return 0;
    }
  });

  if (compact) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Rules Performance</h3>
        <div className="space-y-2">
          {sortedRules.slice(0, 5).map((rule) => (
            <div key={rule.id} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">{rule.name}</span>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {rule.metadata.firing_count}x
                </span>
                {rule.metadata.impressions > 0 && (
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                    {((rule.metadata.clicks / rule.metadata.impressions) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rule Performance Analysis</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('firing_count')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'firing_count'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Fires
          </button>
          <button
            onClick={() => setSortBy('impressions')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'impressions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Impressions
          </button>
          <button
            onClick={() => setSortBy('ctr')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'ctr'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            CTR
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Rule</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Status</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Fires</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Impressions</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Clicks</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">CTR</th>
              <th className="text-right py-2 px-2 text-gray-700 dark:text-gray-300 font-semibold">Target CTR</th>
            </tr>
          </thead>
          <tbody>
            {sortedRules.map((rule) => {
              const ctr =
                rule.metadata.impressions > 0
                  ? ((rule.metadata.clicks / rule.metadata.impressions) * 100).toFixed(1)
                  : '0.0';
              const targetCtr = rule.metadata.ctr_target || 0;
              const isAboveTarget = Number(ctr) >= targetCtr;

              return (
                <tr
                  key={rule.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900 dark:text-white">{rule.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{rule.id}</div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        rule.enabled
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900 dark:text-white font-medium">
                    {rule.metadata.firing_count}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                    {rule.metadata.impressions}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                    {rule.metadata.clicks}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className={`font-semibold ${
                        isAboveTarget
                          ? 'text-green-600 dark:text-green-400'
                          : rule.metadata.impressions > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {ctr}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                    {(targetCtr * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedRules.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No rules configured
        </div>
      )}
    </div>
  );
}
