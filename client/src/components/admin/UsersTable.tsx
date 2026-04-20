import React, { useState, useEffect } from 'react';
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

interface User {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  role: string;
  status: string;
  lastLogin: Date | null;
  articlesCount: number;
  commentsCount: number;
  createdAt: Date;
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onSort: (field: string) => void;
  onViewDetail: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  onChangeStatus: (userId: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function UsersTable({
  users,
  loading,
  onSort,
  onViewDetail,
  onChangeRole,
  onChangeStatus,
  sortField = 'createdAt',
  sortOrder = 'desc',
}: UsersTableProps) {
  const t = {
    en: {
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      lastLogin: 'Last Login',
      articles: 'Articles',
      comments: 'Comments',
      actions: 'Actions',
      view: 'View Details',
      changeRole: 'Change Role',
      deactivate: 'Deactivate',
      activate: 'Activate',
      noUsers: 'No users found',
    },
    pt: {
      name: 'Nome',
      email: 'Email',
      role: 'Função',
      status: 'Status',
      lastLogin: 'Último Login',
      articles: 'Artigos',
      comments: 'Comentários',
      actions: 'Ações',
      view: 'Ver Detalhes',
      changeRole: 'Alterar Função',
      deactivate: 'Desativar',
      activate: 'Ativar',
      noUsers: 'Nenhum usuário encontrado',
    },
  };

  const lang = 'en';
  const SortIcon = sortOrder === 'asc' ? ChevronUp : ChevronDown;

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'EDITOR':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        {t[lang].noUsers}
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
              onClick={() => onSort('fullName')}
            >
              <div className="flex items-center gap-2">
                {t[lang].name}
                {sortField === 'fullName' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('email')}
            >
              <div className="flex items-center gap-2">
                {t[lang].email}
                {sortField === 'email' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('role')}
            >
              <div className="flex items-center gap-2">
                {t[lang].role}
                {sortField === 'role' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('isActive')}
            >
              <div className="flex items-center gap-2">
                {t[lang].status}
                {sortField === 'isActive' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#00D4FF]"
              onClick={() => onSort('lastLoginAt')}
            >
              <div className="flex items-center gap-2">
                {t[lang].lastLogin}
                {sortField === 'lastLoginAt' && <SortIcon size={16} />}
              </div>
            </TableHead>
            <TableHead className="text-center">{t[lang].articles}</TableHead>
            <TableHead className="text-center">{t[lang].comments}</TableHead>
            <TableHead className="text-right">{t[lang].actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-b border-[#00D4FF]/10 hover:bg-[#00D4FF]/5">
              <TableCell className="font-medium">{user.fullName || user.username || 'N/A'}</TableCell>
              <TableCell className="text-sm text-gray-400">{user.email}</TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded border ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded border ${getStatusBadgeColor(user.status)}`}
                >
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-400">
                {formatDate(user.lastLogin)}
              </TableCell>
              <TableCell className="text-center text-sm">{user.articlesCount}</TableCell>
              <TableCell className="text-center text-sm">{user.commentsCount}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-[#00D4FF]/10 rounded">
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#111] border border-[#00D4FF]/20">
                    <DropdownMenuItem
                      onClick={() => onViewDetail(user.id)}
                      className="cursor-pointer hover:bg-[#00D4FF]/10 text-gray-300"
                    >
                      {t[lang].view}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeRole(user.id)}
                      className="cursor-pointer hover:bg-[#00D4FF]/10 text-gray-300"
                    >
                      {t[lang].changeRole}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeStatus(user.id)}
                      className="cursor-pointer hover:bg-[#00D4FF]/10 text-gray-300"
                    >
                      {user.status === 'ACTIVE' ? t[lang].deactivate : t[lang].activate}
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
