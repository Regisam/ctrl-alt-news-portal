import { Trash2 } from 'lucide-react';

interface NotificationItemProps {
  id: string;
  type: 'REPLY' | 'MENTION' | 'KARMA_MILESTONE';
  content: string;
  read: boolean;
  createdAt: string;
  triggeredBy?: {
    username?: string;
    avatarUrl?: string;
  };
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  id,
  type,
  content,
  read,
  createdAt,
  triggeredBy,
  onRead,
  onDelete,
}: NotificationItemProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'REPLY':
        return '💬';
      case 'MENTION':
        return '@';
      case 'KARMA_MILESTONE':
        return '🎉';
      default:
        return '📢';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'REPLY':
        return 'Reply';
      case 'MENTION':
        return 'Mention';
      case 'KARMA_MILESTONE':
        return 'Achievement';
      default:
        return 'Notification';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
        !read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">{getTypeIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{getTypeLabel()}</span>
            {!read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{content}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(createdAt)}</span>
            {triggeredBy?.username && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                by @{triggeredBy.username}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!read && (
            <button
              onClick={() => onRead(id)}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Mark read
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
