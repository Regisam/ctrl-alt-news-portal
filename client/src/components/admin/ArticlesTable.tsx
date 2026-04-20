import React from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ArticlesTableProps {
  articles: Article[];
  loading: boolean;
  onSort: (field: string) => void;
  onEdit: (articleId: string) => void;
  onChangeStatus: (articleId: string) => void;
  onDelete: (articleId: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function ArticlesTable({
  articles,
  loading,
  onSort,
  onEdit,
  onChangeStatus,
  onDelete,
  sortField = 'createdAt',
  sortOrder = 'desc',
}: ArticlesTableProps) {
  const t = {
    en: {
      title: 'Title',
      author: 'Author',
      category: 'Category',
      status: 'Status',
      views: 'Views',
      comments: 'Comments',
      published: 'Published',
      actions: 'Actions',
      edit: 'Edit',
      publish: 'Publish',
      archive: 'Archive',
      delete: 'Delete',
      noArticles: 'No articles found',
    },
    pt: {
      title: 'Título',
      author: 'Autor',
      category: 'Categoria',
      status: 'Status',
      views: 'Visualizações',
      comments: 'Comentários',
      published: 'Publicado',
      actions: 'Ações',
      edit: 'Editar',
      publish: 'Publicar',
      archive: 'Arquivar',
      delete: 'Deletar',
      noArticles: 'Nenhum artigo encontrado',
    },
  };

  const lang = 'en';
  const SortIcon = sortOrder === 'asc' ? ChevronUp : ChevronDown;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'DRAFT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        Loading articles...
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        {t[lang].noArticles}
      </div>
    );
  }

  return (
    <div className="border border-[#00D4FF]/20 rounded bg-[#111]">
      <Table>
        <TableHeader className="bg-[#0a0a0a] border-b border-[#00D4FF]/20">
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('titleEn')}
            >
              <div className="flex items-center gap-2">
                {t[lang].title}
                {sortField === 'titleEn' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('author')}
            >
              <div className="flex items-center gap-2">
                {t[lang].author}
                {sortField === 'author' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('category')}
            >
              <div className="flex items-center gap-2">
                {t[lang].category}
                {sortField === 'category' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-2">
                {t[lang].status}
                {sortField === 'status' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead className="text-center">{t[lang].views}</TableHead>
            <TableHead className="text-center">{t[lang].comments}</TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('publishedAt')}
            >
              <div className="flex items-center gap-2">
                {t[lang].published}
                {sortField === 'publishedAt' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead className="text-right">{t[lang].actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id} className="border-b border-[#00D4FF]/10 hover:bg-[#00D4FF]/5">
              <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
              <TableCell className="text-sm text-gray-400">{article.author}</TableCell>
              <TableCell className="text-sm">{article.category}</TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded border ${getStatusBadgeColor(article.status)}`}
                >
                  {article.status}
                </span>
              </TableCell>
              <TableCell className="text-center text-sm">{article.views}</TableCell>
              <TableCell className="text-center text-sm">{article.comments}</TableCell>
              <TableCell className="text-sm text-gray-400">{article.published}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-[#00D4FF]/10 rounded">
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#111] border border-[#00D4FF]/20">
                    <DropdownMenuItem
                      onClick={() => onEdit(article.id)}
                      className="cursor-pointer hover:bg-[#00D4FF]/10 text-gray-300"
                    >
                      {t[lang].edit}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeStatus(article.id)}
                      className="cursor-pointer hover:bg-[#00D4FF]/10 text-gray-300"
                    >
                      {article.status === 'PUBLISHED' ? t[lang].archive : t[lang].publish}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(article.id)}
                      className="cursor-pointer hover:bg-red-500/10 text-red-400"
                    >
                      {t[lang].delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
