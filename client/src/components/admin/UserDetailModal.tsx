import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { UserActivity } from './UserActivity';

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
  _count?: {
    articles: number;
    comments: number;
    bookmarks: number;
  };
}

interface UserDetailModalProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
}

export function UserDetailModal({ isOpen, user, onClose }: UserDetailModalProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#111] border border-[#00D4FF]/20">
        <DialogHeader>
          <DialogTitle className="text-[#00D4FF]">User Details</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#00D4FF]" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Header */}
          <div className="flex gap-4">
            <img
              src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg'}
              alt={user.fullName || 'User'}
              className="w-16 h-16 rounded-full border border-[#00D4FF]/20"
            />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                {user.fullName || user.username || 'Anonymous'}
              </h2>
              <p className="text-sm text-gray-400">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-block px-2 py-1 text-xs rounded border bg-red-500/20 text-red-400 border-red-500/30">
                  {user.role}
                </span>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded border ${
                    user.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-4 gap-2 p-4 bg-[#0a0a0a] rounded border border-[#00D4FF]/10">
            <div>
              <p className="text-xs text-gray-400">Karma</p>
              <p className="text-lg font-bold text-[#00D4FF]">{user.karma}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Articles</p>
              <p className="text-lg font-bold text-[#00D4FF]">{user._count?.articles || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Comments</p>
              <p className="text-lg font-bold text-[#00D4FF]">{user._count?.comments || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Bookmarks</p>
              <p className="text-lg font-bold text-[#00D4FF]">{user._count?.bookmarks || 0}</p>
            </div>
          </div>

          {/* User Activity */}
          <UserActivity user={user} />

          {/* User Info */}
          <div className="space-y-2 p-4 bg-[#0a0a0a] rounded border border-[#00D4FF]/10">
            <div>
              <p className="text-xs text-gray-400">Bio</p>
              <p className="text-sm text-white">{user.bio || 'No bio'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email Verified</p>
              <p className="text-sm text-white">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Member Since</p>
              <p className="text-sm text-white">
                {new Date(user.createdAt).toLocaleDateString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Last Updated</p>
              <p className="text-sm text-white">
                {new Date(user.updatedAt).toLocaleDateString('en-US')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
