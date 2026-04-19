import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Trash2, Flame } from 'lucide-react';
import { ReplyForm } from './ReplyForm';

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
  replyCount?: number;
}

interface CommentProps {
  comment: CommentData;
  articleId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  isReplyFormOpen: boolean;
  currentUserId?: string;
  currentUserName?: string;
  maxDepth?: number;
  lang?: 'en' | 'pt';
}

const MAX_DEPTH = 3;

const i18n = {
  reply: { en: 'Reply', pt: 'Responder' },
  delete: { en: 'Delete', pt: 'Deletar' },
  replies: { en: 'replies', pt: 'respostas' },
  collapseReplies: { en: 'Collapse replies', pt: 'Ocultar respostas' },
  expandReplies: { en: 'Expand replies', pt: 'Mostrar respostas' },
};

export const Comment: React.FC<CommentProps> = ({
  comment,
  articleId,
  onReply,
  onDelete,
  onReplySubmit,
  isReplyFormOpen,
  currentUserId,
  currentUserName = 'Anonymous',
  maxDepth = MAX_DEPTH,
  lang = 'en',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const depth = comment.depth || 1;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;
  const replyCount = comment.replyCount ?? comment.replies.length;
  const isTrending = replyCount >= 5;

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
      className={`border-l-2 border-gray-300 dark:border-gray-600 transition-all duration-300 ease-in-out ${
        depth > 1 ? 'ml-2 sm:ml-4 md:ml-6' : 'ml-0'
      }`}
      role="article"
      aria-label={`Comment by ${comment.author.fullName}`}
    >
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-r-lg mb-2">
        {/* Parent context for replies */}
        {comment.parentContext && (
          <div className="mb-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs sm:text-sm border-l-2 border-blue-400">
            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Replying to {comment.parentContext.author.fullName}
            </div>
            <div className="text-gray-600 dark:text-gray-400 truncate">
              {comment.parentContext.content.substring(0, 80)}...
            </div>
          </div>
        )}

        {/* Comment header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {comment.author.avatarUrl && (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.fullName}
                className="w-7 sm:w-8 h-7 sm:h-8 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                {comment.author.fullName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </div>
            </div>
          </div>

          {/* Depth indicator */}
          {depth > 1 && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded whitespace-nowrap">
              Level {depth}
            </span>
          )}
        </div>

        {/* Comment content */}
        <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-3 leading-relaxed break-words">
          {comment.content}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {canReply && (
            <button
              onClick={() => onReply(comment.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onReply(comment.id);
                }
              }}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors"
              aria-label={lang === 'pt' ? 'Responder ao comentário' : 'Reply to comment'}
              tabIndex={0}
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">{i18n.reply[lang]}</span>
            </button>
          )}

          {currentUserId === comment.author.id && (
            <button
              onClick={() => onDelete(comment.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onDelete(comment.id);
                }
              }}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors"
              aria-label={lang === 'pt' ? 'Deletar comentário' : 'Delete comment'}
              tabIndex={0}
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">{i18n.delete[lang]}</span>
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors ml-auto"
              aria-label={isExpanded ? i18n.collapseReplies[lang] : i18n.expandReplies[lang]}
              aria-expanded={isExpanded}
              tabIndex={0}
            >
              {isExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              <span className="text-xs font-semibold">
                {replyCount} {replyCount === 1 ? (lang === 'pt' ? 'resposta' : 'reply') : i18n.replies[lang]}
              </span>
              {isTrending && (
                <Flame size={14} className="text-orange-500" aria-label="Trending thread" />
              )}
            </button>
          )}
        </div>

        {/* Reply form */}
        {isReplyFormOpen && currentUserId && (
          <ReplyForm
            parentId={comment.id}
            articleId={articleId}
            authorId={currentUserId}
            authorName={currentUserName}
            onSubmit={async (content) => {
              await onReplySubmit(comment.id, content);
              onReply(comment.id);
            }}
            onCancel={() => onReply(comment.id)}
          />
        )}
      </div>

      {/* Recursive replies */}
      {hasReplies && (
        <div
          className={`space-y-0 overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
          role="region"
          aria-hidden={!isExpanded}
        >
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={{
                ...reply,
                depth: depth + 1,
              }}
              articleId={articleId}
              onReply={onReply}
              onDelete={onDelete}
              onReplySubmit={onReplySubmit}
              isReplyFormOpen={isReplyFormOpen}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              maxDepth={maxDepth}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
