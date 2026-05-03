import React, { useState, useMemo } from "react";
import { useBookmarks } from "../hooks/useBookmarks";
import { Trash2, Calendar, Tag, Search } from "lucide-react";

export function ReadingListPage() {
  const {
    bookmarks,
    removeBookmark,
    clearBookmarks,
    bookmarkCount,
    lastSavedTimestamp,
  } = useBookmarks();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map((b) => b.category));
    return Array.from(cats).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query)
      );
    }

    if (sortOrder === "oldest") {
      result = [...result].reverse();
    }

    return result;
  }, [bookmarks, selectedCategory, searchQuery, sortOrder]);

  const handleRemoveBookmark = (articleId: string) => {
    removeBookmark(articleId);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Tem certeza que deseja remover todos os favoritos? Esta ação não pode ser desfeita."
      )
    ) {
      clearBookmarks();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoryColors: Record<string, string> = {
    AI: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    Science: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    Robotics: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    Gadgets: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Meus Favoritos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {bookmarkCount} artigo{bookmarkCount !== 1 ? "s" : ""} favoritado{bookmarkCount !== 1 ? "s" : ""}
            {lastSavedTimestamp && (
              <>
                {" • "}
                <span className="text-sm">
                  Último: {formatDate(lastSavedTimestamp)}
                </span>
              </>
            )}
          </p>
        </div>

        {bookmarkCount > 0 ? (
          <>
            {/* Controls */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar favoritos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  aria-label="Buscar favoritos"
                />
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label
                    htmlFor="category-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Tag size={16} className="inline mr-1" />
                    Categoria
                  </label>
                  <select
                    id="category-select"
                    value={selectedCategory || ""}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Filtrar por categoria"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex-1">
                  <label
                    htmlFor="sort-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Calendar size={16} className="inline mr-1" />
                    Ordenar
                  </label>
                  <select
                    id="sort-select"
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "newest" | "oldest")
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Ordenar favoritos"
                  >
                    <option value="newest">Mais novos primeiro</option>
                    <option value="oldest">Mais antigos primeiro</option>
                  </select>
                </div>

                {/* Clear All Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleClearAll}
                    className="w-full px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium flex items-center justify-center gap-2"
                    aria-label="Remover todos os favoritos"
                  >
                    <Trash2 size={18} />
                    Limpar Tudo
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {filteredBookmarks.length > 0 ? (
              <div className="space-y-4">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.articleId}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {bookmark.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              bookmark.category
                            )}`}
                          >
                            {bookmark.category}
                          </span>

                          <span className="text-gray-400 dark:text-gray-600">•</span>

                          <time dateTime={new Date(bookmark.dateSaved).toISOString()}>
                            {formatDate(bookmark.dateSaved)}
                          </time>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleRemoveBookmark(bookmark.articleId)
                          }
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label={`Remover "${bookmark.title}" dos favoritos`}
                          title="Remover dos favoritos"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Nenhum artigo encontrado com os filtros aplicados.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              Você ainda não tem artigos favoritos.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              Clique no ícone de marcador em qualquer artigo para adicionar aos
              favoritos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingListPage;
