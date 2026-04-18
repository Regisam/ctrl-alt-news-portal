import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Trash2 } from 'lucide-react';

interface Author {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

interface ParentContext {
  id: string;
  content: string;
  author: Author;
}

interface CommentData {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  parentId?: string;
  parentContext?: ParentContext;
  replies: CommentData[];
  depth?: number;
}

interface CommentProps {
  comment: CommentData;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  isReplyFormOpen: boolean;
  currentUserId?: string;
  maxDepth?: number;
}

const MAX_DEPTH = 3;

export const Comment: React.FC<CommentProps> = ({
  comment,
  onReply,
  onDelete,
  isReplyFormOpen,
  currentUserId,
  maxDepth = MAX_DEPTH,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const depth = comment.depth || 1;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      className={`border-l-2 border-gray-300 dark:border-gray-600 ${
        depth > 1 ? 'ml-4 md:ml-6' : 'ml-0'
      }`}
      role="article"
      aria-label={`Comment by ${comment.author.fullName}`}
    >
      <div className="p-4 bg-white dark:bg-gray-800 rounded-r-lg mb-2">
        {/* Parent context for replies */}
        {comment.parentContext && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm border-l-2 border-blue-400">
            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Replying to {comment.parentContext.author.fullName}
            </div>
            <div className="text-gray-600 dark:text-gray-400 truncate">
              {comment.parentContext.content.substring(0, 80)}...
            </div>
          </div>
        )}

        {/* Comment header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.author.avatarUrl && (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {comment.author.fullName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </div>
            </div>
          </div>

          {/* Depth indicator */}
          {depth > 1 && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded">
              Level {depth}
            </span>
          )}
        </div>

        {/* Comment content */}
        <div className="text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">
          {comment.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 text-sm">
          {canReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Reply to comment"
            >
              <MessageCircle size={16} />
              Reply
            </button>
          )}

          {currentUserId === comment.author.id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete comment"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ml-auto"
              aria-label={isExpanded ? 'Collapse replies' : 'Expand replies'}
            >
              {isExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              <span className="text-xs font-semibold">
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>

        {/* Reply form placeholder */}
        {isReplyFormOpen && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Reply form would go here (Story 4.5)
            </div>
          </div>
        )}
      </div>

      {/* Recursive replies */}
      {isExpanded && hasReplies && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={{
                ...reply,
                depth: depth + 1,
              }}
              onReply={onReply}
              onDelete={onDelete}
              isReplyFormOpen={isReplyFormOpen}
              currentUserId={currentUserId}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
