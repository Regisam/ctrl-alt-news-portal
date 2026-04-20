import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminRoute } from '../../components/admin/AdminRoute';
import { ArticlesTable } from '../../components/admin/ArticlesTable';
import { ArticleEditModal } from '../../components/admin/ArticleEditModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Article {
  id: string;
  title: string;
  author: string;
  category: string;
  status: string;
  views: number;
  comments: number;
  published: string;
}

interface ArticleDetail {
  id: string;
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  excerptPt: string;
  categoryId: string;
}

interface Category {
  id: string;
  nameEn: string;
}

export function AdminArticles() {
  const [lang] = useState<'en' | 'pt'>('en');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const t = {
    en: {
      title: 'Articles Management',
      description: 'Manage articles, publish, archive, and bulk operations',
      search: 'Search by title or author...',
      category: 'Filter by category',
      status: 'Filter by status',
      allCategories: 'All Categories',
      allStatus: 'All Status',
      loading: 'Loading articles...',
      error: 'Failed to load articles',
      pages: 'Pages',
      of: 'of',
    },
    pt: {
      title: 'Gerenciamento de Artigos',
      description: 'Gerenciar artigos, publicar, arquivar e operações em massa',
      search: 'Procurar por título ou autor...',
      category: 'Filtrar por categoria',
      status: 'Filtrar por status',
      allCategories: 'Todas as Categorias',
      allStatus: 'Todos os Status',
      loading: 'Carregando artigos...',
      error: 'Falha ao carregar artigos',
      pages: 'Páginas',
      of: 'de',
    },
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: sortField,
        order: sortOrder,
      });

      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/articles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch articles');

      const data = await response.json();
      if (data.success) {
        setArticles(data.data.articles);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetail = async (articleId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch article detail');

      const data = await response.json();
      if (data.success) {
        setSelectedArticle(data.data);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching article detail:', error);
    }
  };

  const handleSaveArticle = async (updates: any) => {
    if (!selectedArticle) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to save article');
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleChangeStatus = async (articleId: string) => {
    try {
      const article = articles.find((a) => a.id === articleId);
      if (!article) return;

      const newStatus = article.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to change status');
      fetchArticles();
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Delete this article? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/articles/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: [articleId],
          action: 'delete',
        }),
      });

      if (!response.ok) throw new Error('Failed to delete article');
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, sortField, sortOrder, search, categoryFilter, statusFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const pages = Math.ceil(total / limit);

  return (
    <AdminRoute>
      <AdminLayout lang={lang}>
        <div>
          <h1 className="text-3xl font-bold text-[#00D4FF] mb-2">{t[lang].title}</h1>
          <p className="text-gray-400 mb-8">{t[lang].description}</p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder={t[lang].search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white"
            />

            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white">
                <SelectValue placeholder={t[lang].category} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#00D4FF]/20">
                <SelectItem value="">{t[lang].allCategories}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nameEn}>
                    {cat.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white">
                <SelectValue placeholder={t[lang].status} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#00D4FF]/20">
                <SelectItem value="">{t[lang].allStatus}</SelectItem>
                <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Articles Table */}
          <ArticlesTable
            articles={articles}
            loading={loading}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={(field) => {
              if (field === sortField) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field);
                setSortOrder('desc');
              }
            }}
            onEdit={fetchArticleDetail}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center text-sm text-gray-400">
            <div>
              {t[lang].pages}: {page} {t[lang].of} {pages}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
                className="border-[#00D4FF]/20"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                variant="outline"
                className="border-[#00D4FF]/20"
              >
                Next
              </Button>
            </div>
          </div>

          {/* Edit Modal */}
          <ArticleEditModal
            isOpen={showEditModal}
            articleId={selectedArticle?.id || null}
            article={selectedArticle}
            categories={categories}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveArticle}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
