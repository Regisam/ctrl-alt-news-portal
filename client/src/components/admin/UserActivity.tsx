import React from 'react';
import { Clock, FileText, MessageSquare } from 'lucide-react';

interface UserActivityProps {
  user: {
    lastLoginAt: Date | null;
    _count?: {
      articles: number;
      comments: number;
      bookmarks: number;
    };
  };
}

export function UserActivity({ user }: UserActivityProps) {
  const formatLastLogin = (date: Date | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US');
  };

  return (
    <div className="space-y-3 p-4 bg-[#0a0a0a] rounded border border-[#00D4FF]/10">
      <h3 className="text-sm font-semibold text-gray-300">Activity</h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <span className="text-sm text-gray-400">Last Login:</span>
          <span className="text-sm text-white font-medium">{formatLastLogin(user.lastLoginAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-500" />
          <span className="text-sm text-gray-400">Articles Posted:</span>
          <span className="text-sm text-white font-medium">{user._count?.articles || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-500" />
          <span className="text-sm text-gray-400">Comments:</span>
          <span className="text-sm text-white font-medium">{user._count?.comments || 0}</span>
        </div>
      </div>
    </div>
  );
}
