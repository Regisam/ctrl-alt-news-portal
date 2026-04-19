import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { NotificationItem } from './NotificationItem';

interface Notification {
  id: string;
  userId: string;
  type: 'REPLY' | 'MENTION' | 'KARMA_MILESTONE';
  content: string;
  read: boolean;
  createdAt: string;
  relatedCommentId?: string;
  triggeredBy?: {
    id: string;
    username?: string;
    avatarUrl?: string;
  };
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  onRead,
  onDelete,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close notifications"
      />

      {/* Dropdown Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </div>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                type={notification.type}
                content={notification.content}
                read={notification.read}
                createdAt={notification.createdAt}
                triggeredBy={notification.triggeredBy}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onMarkAllRead}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
