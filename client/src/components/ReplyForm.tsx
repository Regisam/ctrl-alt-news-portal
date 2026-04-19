import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyFormProps {
  parentId: string;
  articleId?: string;
  authorId: string;
  authorName: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  lang?: 'en' | 'pt';
}

const MIN_LENGTH = 5;
const MAX_LENGTH = 5000;

const i18n = {
  replyTo: { en: 'Reply to', pt: 'Responder a' },
  placeholder: { en: 'Write your reply here...', pt: 'Escreva sua resposta aqui...' },
  submit: { en: 'Post Reply', pt: 'Publicar Resposta' },
  cancel: { en: 'Cancel', pt: 'Cancelar' },
  empty: { en: 'Reply cannot be empty', pt: 'Resposta não pode estar vazia' },
  tooShort: { en: `Reply must be at least ${MIN_LENGTH} characters`, pt: `Resposta deve ter pelo menos ${MIN_LENGTH} caracteres` },
  tooLong: { en: `Reply must not exceed ${MAX_LENGTH} characters`, pt: `Resposta não pode exceder ${MAX_LENGTH} caracteres` },
};

export const ReplyForm: React.FC<ReplyFormProps> = ({
  parentId,
  articleId: _articleId,
  authorId,
  authorName,
  onSubmit,
  onCancel,
  lang = 'en',
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!content.trim()) {
      newErrors.content = i18n.empty[lang];
    } else if (content.length < MIN_LENGTH) {
      newErrors.content = i18n.tooShort[lang];
    } else if (content.length > MAX_LENGTH) {
      newErrors.content = i18n.tooLong[lang];
    }

    if (!authorId) {
      newErrors.authorId = 'Author ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(content);
      setContent('');
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post reply';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"
    >
      <div className="mb-3">
        <label htmlFor={`reply-${parentId}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
          {i18n.replyTo[lang]} {authorName}
        </label>
        <textarea
          id={`reply-${parentId}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={i18n.placeholder[lang]}
          className={`w-full px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.content ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          disabled={isLoading}
          aria-label="Reply text content"
          aria-describedby={errors.content ? `error-${parentId}` : undefined}
        />
        {errors.content && (
          <div id={`error-${parentId}`} className="text-xs text-red-600 dark:text-red-400 mt-1">
            {errors.content}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {content.length} / {MAX_LENGTH}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          aria-label={lang === 'pt' ? 'Enviar resposta' : 'Submit reply'}
        >
          {isLoading ? (
            <>
              <Loader size={16} className="animate-spin" />
              {lang === 'pt' ? 'Publicando...' : 'Posting...'}
            </>
          ) : (
            <>
              <Send size={16} />
              {i18n.submit[lang]}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          aria-label={lang === 'pt' ? 'Cancelar resposta' : 'Cancel reply'}
        >
          {i18n.cancel[lang]}
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;
