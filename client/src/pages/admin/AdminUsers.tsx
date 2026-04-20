import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminRoute } from '../../components/admin/AdminRoute';
import { UsersTable } from '../../components/admin/UsersTable';
import { UserDetailModal } from '../../components/admin/UserDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader } from 'lucide-react';

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

interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  karma: number;
  status: string;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    articles: number;
    comments: number;
    bookmarks: number;
  };
}

export function AdminUsers() {
  const [lang] = useState<'en' | 'pt'>('en');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(100);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const t = {
    en: {
      title: 'Users Management',
      description: 'Manage all users, roles, and permissions',
      search: 'Search by name or email...',
      role: 'Filter by role',
      status: 'Filter by status',
      allRoles: 'All Roles',
      allStatus: 'All Status',
      loading: 'Loading users...',
      error: 'Failed to load users',
      pages: 'Pages',
      of: 'of',
    },
    pt: {
      title: 'Gerenciamento de Usuários',
      description: 'Gerenciar todos os usuários, funções e permissões',
      search: 'Procurar por nome ou email...',
      role: 'Filtrar por função',
      status: 'Filtrar por status',
      allRoles: 'Todas as Funções',
      allStatus: 'Todos os Status',
      loading: 'Carregando usuários...',
      error: 'Falha ao carregar usuários',
      pages: 'Páginas',
      of: 'de',
    },
  };

  const fetchUsers = async () => {
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
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch user detail');

      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, sortField, sortOrder, search, roleFilter, statusFilter]);

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

            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white">
                <SelectValue placeholder={t[lang].role} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#00D4FF]/20">
                <SelectItem value="">{t[lang].allRoles}</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="EDITOR">EDITOR</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#00D4FF]/20 text-white">
                <SelectValue placeholder={t[lang].status} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#00D4FF]/20">
                <SelectItem value="">{t[lang].allStatus}</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <UsersTable
            users={users}
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
            onViewDetail={fetchUserDetail}
            onChangeRole={(userId) => console.log('Change role:', userId)}
            onChangeStatus={(userId) => console.log('Change status:', userId)}
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

          {/* Detail Modal */}
          <UserDetailModal
            isOpen={showDetailModal}
            user={selectedUser}
            onClose={() => setShowDetailModal(false)}
          />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
