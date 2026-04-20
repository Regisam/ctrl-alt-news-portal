import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('accessToken');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/admin/auth/check', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('accessToken');
          navigate('/login');
          return;
        }

        if (response.status === 403) {
          // User is not admin
          setError('Admin access required');
          setIsAuthorized(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to verify admin access');
        }

        const data = (await response.json()) as { success: boolean; data: CurrentUser };

        if (data.success && data.data.role === 'ADMIN') {
          setIsAuthorized(true);
          setError(null);
        } else {
          setError('Insufficient permissions');
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Admin access check failed:', err);
        setError('Failed to verify admin access');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-[#00D4FF]" size={40} />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error || 'You do not have permission to access this page.'}</p>
          <a href="/login" className="text-[#00D4FF] hover:underline">
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
