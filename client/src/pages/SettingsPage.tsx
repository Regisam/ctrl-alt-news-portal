import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Moon,
  Sun,
  AlertCircle,
} from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingHistory } from '../hooks/useReadingHistory';
import { useReactions } from '../hooks/useReactions';
import { useTheme } from '../contexts/ThemeContext';
import { setExperimentEnabled } from '../lib/ab-testing';
import { feedLayoutExperiment, bookmarkCopyExperiment } from '../lib/ab-experiments';

const CATEGORIES = ['AI', 'Science', 'Robotics', 'Gadgets'];

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

function ConfirmationModal({
  isOpen,
  title,
  description,
  actionLabel,
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded text-white transition ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    favoriteCategories,
    updateFavoriteCategories,
    toggleDarkMode,
  } = useUserPreferences();
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { history, clearHistory } = useReadingHistory();
  const { reactions, clearReactions } = useReactions();
  const { theme, toggleTheme } = useTheme();

  const [abTestOptOut, setAbTestOptOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggleCategory = (category: string) => {
    const updated = favoriteCategories.includes(category)
      ? favoriteCategories.filter(c => c !== category)
      : [...favoriteCategories, category];
    updateFavoriteCategories(updated);
  };

  const handleToggleTheme = () => {
    toggleDarkMode();
    toggleTheme?.();
  };

  const handleToggleABOptOut = () => {
    const newOptOut = !abTestOptOut;
    setAbTestOptOut(newOptOut);
    setExperimentEnabled(feedLayoutExperiment.id, !newOptOut);
    setExperimentEnabled(bookmarkCopyExperiment.id, !newOptOut);
    showSuccess('Preferência de A/B test atualizada');
  };

  const handleClearBookmarks = () => {
    clearBookmarks();
    setShowConfirmation(null);
    showSuccess('Favoritos removidos com sucesso');
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirmation(null);
    showSuccess('Histórico removido com sucesso');
  };

  const handleClearReactions = () => {
    clearReactions();
    setShowConfirmation(null);
    showSuccess('Reações removidas com sucesso');
  };

  const handleExportData = () => {
    // Date.now() called inside event handler, not during render
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const data = {
      exportDate: new Date(timestamp).toISOString(),
      preferences: {
        favoriteCategories,
      },
      bookmarks: bookmarks.map(b => ({
        articleId: b.articleId,
        title: b.title,
        category: b.category,
        dateSaved: new Date(b.dateSaved).toISOString(),
      })),
      readingHistory: history.map(h => ({
        articleId: h.articleId,
        title: h.title,
        category: h.category,
        timestamp: new Date(h.timestamp).toISOString(),
      })),
      reactions: reactions.map(r => ({
        articleId: r.articleId,
        type: r.type,
        timestamp: new Date(r.timestamp).toISOString(),
      })),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ctrl-alt-data-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('Dados exportados com sucesso');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas preferências, dados e privacidade
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Preference Categories */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Categorias Favoritas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Selecione as categorias que deseja ver em destaque
          </p>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(category => (
              <label
                key={category}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <input
                  type="checkbox"
                  checked={favoriteCategories.includes(category)}
                  onChange={() => handleToggleCategory(category)}
                  className="w-5 h-5 rounded accent-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Theme Toggle */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Aparência
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-gray-700 dark:text-gray-300">
                Modo {theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </div>
            <button
              onClick={handleToggleTheme}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white"
            >
              Alternar
            </button>
          </div>
        </section>

        {/* A/B Testing Opt-Out */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Testes A/B
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Você está {abTestOptOut ? 'excluído' : 'incluído'} dos testes A/B
          </p>
          <button
            onClick={handleToggleABOptOut}
            className={`px-4 py-2 rounded-lg transition text-white ${
              abTestOptOut
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {abTestOptOut ? 'Participar novamente' : 'Excluir dos testes'}
          </button>
        </section>

        {/* Data Management */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gerenciar Dados
          </h2>

          {/* Bookmarks */}
          <div className="mb-6 pb-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900 dark:text-white font-medium">
                Favoritos ({bookmarks.length})
              </h3>
              {bookmarks.length > 0 && (
                <button
                  onClick={() => setShowConfirmation('bookmarks')}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover todos
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {bookmarks.length === 0
                ? 'Você não tem favoritos'
                : `Você tem ${bookmarks.length} artigo${bookmarks.length !== 1 ? 's' : ''} marcado${bookmarks.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Reading History */}
          <div className="mb-6 pb-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900 dark:text-white font-medium">
                Histórico ({history.length})
              </h3>
              {history.length > 0 && (
                <button
                  onClick={() => setShowConfirmation('history')}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover tudo
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {history.length === 0
                ? 'Seu histórico está vazio'
                : `Você visitou ${history.length} artigo${history.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Reactions */}
          <div className="mb-6 pb-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900 dark:text-white font-medium">
                Reações ({reactions.length})
              </h3>
              {reactions.length > 0 && (
                <button
                  onClick={() => setShowConfirmation('reactions')}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover tudo
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reactions.length === 0
                ? 'Você não tem reações'
                : `Você registrou ${reactions.length} reação${reactions.length !== 1 ? 'ões' : ''}`}
            </p>
          </div>

          {/* Export Data */}
          <div>
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Exportar Dados (JSON)
            </button>
          </div>
        </section>

        {/* Privacy Info */}
        <section className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            Todos os seus dados são armazenados localmente no navegador. Você pode exportar seus dados a qualquer momento.
          </p>
        </section>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showConfirmation === 'bookmarks'}
        title="Remover todos os favoritos?"
        description="Esta ação não pode ser desfeita. Você perderá todos os seus favoritos salvos."
        actionLabel="Remover"
        onConfirm={handleClearBookmarks}
        onCancel={() => setShowConfirmation(null)}
        isDangerous
      />

      <ConfirmationModal
        isOpen={showConfirmation === 'history'}
        title="Limpar histórico de leitura?"
        description="Esta ação não pode ser desfeita. Seu histórico de leitura será removido."
        actionLabel="Limpar"
        onConfirm={handleClearHistory}
        onCancel={() => setShowConfirmation(null)}
        isDangerous
      />

      <ConfirmationModal
        isOpen={showConfirmation === 'reactions'}
        title="Remover todas as reações?"
        description="Esta ação não pode ser desfeita. Todas as suas reações serão removidas."
        actionLabel="Remover"
        onConfirm={handleClearReactions}
        onCancel={() => setShowConfirmation(null)}
        isDangerous
      />
    </div>
  );
}
