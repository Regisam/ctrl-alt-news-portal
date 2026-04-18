# Integration Points — Frontend ↔ Backend Communication
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Scope**: React 19 Frontend + Express.js Backend

---

## Overview

This document describes how the React frontend communicates with the Express backend, including data flow, error handling, and state management patterns.

---

## 1. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   React 19 Frontend (SPA)                     │
├──────────────────────────────────────────────────────────────┤
│  Pages: Home, Article, Category, Search, Contact, About...   │
│  Components: ArticleCard, CommentSection, SearchBar...       │
│  State: User (auth), Articles (cache), Theme (dark/light)    │
├──────────────────────────────────────────────────────────────┤
│              React Query (Client-side caching)                │
├──────────────────────────────────────────────────────────────┤
│                  Axios HTTP Client                            │
│  - Base URL: /api/v1 (relative) or https://api.../v1 (abs)   │
│  - Interceptors: Auth tokens, error handling                  │
│  - Timeout: 30 seconds                                        │
├──────────────────────────────────────────────────────────────┤
│                      HTTPS / JSON                             │
├──────────────────────────────────────────────────────────────┤
│                  Express.js API Server                        │
├──────────────────────────────────────────────────────────────┤
│  Routes: /articles, /auth, /users, /comments, /search...     │
│  Middleware: Auth, Validation, Error handling, Logging       │
│  Services: Database (Prisma), Email, Cache (Redis)           │
├──────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. HTTP Client Setup

### Axios Configuration

```typescript
// client/src/lib/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Token expired: try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh-token', {}, {
          withCredentials: true
        });

        localStorage.setItem('accessToken', data.data.accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed: redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Environment Configuration

**`.env.example`**:
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_GOOGLE_CLIENT_ID=your-client-id
```

**Development**: `http://localhost:3001/api/v1`  
**Production**: `https://api.ctrlaltnews.com/v1` (or inferred from current domain)

---

## 3. Data Flow Examples

### Example 1: Fetching Articles List

```
Frontend Flow:
1. HomePage mounts
2. useQuery(['articles', { page: 1 }]) triggers
3. API call: GET /api/v1/articles?page=1&limit=20
4. Backend processes and returns JSON
5. React Query caches response
6. Component re-renders with articles

Code:
// client/src/pages/Home.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data } = await api.get('/articles', {
        params: { page: 1, limit: 20 }
      });
      return data.data; // Extract data from response wrapper
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading articles</div>;

  return (
    <div className="grid gap-4">
      {data?.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### Example 2: Creating a Comment

```
Frontend Flow:
1. User types comment and clicks "Post"
2. POST /api/v1/articles/{id}/comments sent
3. Optimistic UI update (show comment immediately)
4. Backend processes and returns comment ID
5. React Query invalidates comments query
6. Comments refetch and show real data from server

Code:
// client/src/components/CommentForm.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function CommentForm({ articleId }: { articleId: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/articles/${articleId}/comments`, {
        content
      });
      return data.data;
    },
    onSuccess: () => {
      // Refetch comments for this article
      queryClient.invalidateQueries({
        queryKey: ['comments', articleId]
      });
      setContent('');
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 401) {
        // User not logged in
        window.location.href = '/login';
      } else {
        toast.error('Failed to post comment');
      }
    }
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate(content);
    }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
```

### Example 3: User Login (Authentication)

```
Frontend Flow:
1. User submits email + password
2. POST /api/v1/auth/login sent
3. Backend verifies password, returns tokens
4. Frontend stores accessToken in memory/localStorage
5. Refresh token set in httpOnly cookie (backend)
6. Redirect to home page
7. All subsequent requests include Authorization header

Code:
// client/src/pages/LoginPage.tsx
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import api from '@/lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (response) => {
      // Store access token
      localStorage.setItem('accessToken', response.tokens.accessToken);
      
      // Store user info in state/context
      setUser(response.data);
      
      // Refresh token already in httpOnly cookie (set by server)
      
      // Redirect
      navigate('/');
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      }
    }
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ email, password });
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={mutation.isPending}>
        Login
      </button>
    </form>
  );
}
```

---

## 4. Error Handling

### Error Response Format

**API Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

### Frontend Error Handling

```typescript
// client/src/lib/errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export function handleApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as any;

    if (error.response?.status === 401) {
      // Unauthorized: redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status === 400) {
      // Validation error: show details
      if (data?.error?.details) {
        data.error.details.forEach((detail: any) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        toast.error(data?.error?.message || 'Invalid request');
      }
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait before trying again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      // Log to Sentry for monitoring
      console.error('Server error:', error);
    } else {
      toast.error(data?.error?.message || 'An error occurred');
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  }
}
```

### React Query Integration

```typescript
// client/src/hooks/useMutationWithErrorHandling.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errorHandler';
import { AxiosError } from 'axios';

export function useMutationWithErrorHandling<TData, TError = AxiosError>(
  options: UseMutationOptions<TData, TError>
) {
  return useMutation({
    ...options,
    onError: (error) => {
      handleApiError(error);
      options.onError?.(error);
    }
  });
}
```

---

## 5. Authentication Flow

### Login → Token Storage → API Calls

```
1. User Login (POST /auth/login)
   ├─ Frontend sends email + password
   ├─ Backend verifies, returns tokens
   ├─ Frontend stores accessToken (memory or localStorage)
   ├─ Backend sets refreshToken in httpOnly cookie
   └─ Redirect to /

2. Subsequent API Calls
   ├─ Frontend reads accessToken from storage
   ├─ Adds to Authorization header: "Bearer {token}"
   ├─ Backend verifies token in middleware
   ├─ Attaches userId to request
   └─ Endpoint uses userId for authorization

3. Token Expiration
   ├─ Backend returns 401 Unauthorized
   ├─ Frontend sends POST /auth/refresh-token
   ├─ Backend uses refresh token from cookie
   ├─ Returns new accessToken
   ├─ Frontend retries original request with new token
   └─ If refresh fails, redirect to /login

4. Logout
   ├─ Frontend clears accessToken from storage
   ├─ Frontend sends POST /auth/logout
   ├─ Backend clears refreshToken cookie
   ├─ Redirect to /
   └─ Next API call: no token → 401 → /login
```

---

## 6. State Management Strategy

### Global State (Auth)

```typescript
// client/src/contexts/AuthContext.tsx
import { createContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'AUTHOR' | 'ADMIN';
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Restore from localStorage on mount
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: false, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Server State (React Query)

```typescript
// client/src/hooks/useArticles.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useArticles(page: number = 1) {
  return useQuery({
    queryKey: ['articles', { page }],
    queryFn: async () => {
      const { data } = await api.get('/articles', {
        params: { page, limit: 20 }
      });
      return data.data; // Extract from response wrapper
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
  });
}
```

---

## 7. CORS Handling

### Development

Backend (Express) CORS middleware:
```typescript
// server/index.ts
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

Frontend (Vite):
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

### Production

Backend accepts only frontend domain:
```typescript
const allowedOrigins = [process.env.FRONTEND_URL];
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
```

---

## 8. Polling & Realtime (Future)

### Short-term: Polling

```typescript
// Poll for new comments every 5 seconds
const { data: comments } = useQuery({
  queryKey: ['comments', articleId],
  queryFn: () => api.get(`/articles/${articleId}/comments`),
  refetchInterval: 5000 // Every 5 seconds
});
```

### Long-term: WebSockets

```typescript
// Future: Switch to WebSocket for real-time
const ws = new WebSocket('wss://api.ctrlaltnews.io/ws');

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new-comment') {
    // Update comments in React Query cache
    queryClient.invalidateQueries(['comments', articleId]);
  }
});
```

---

## 9. Integration Checklist

### Frontend Development

- [ ] Axios configured with base URL
- [ ] Auth interceptors handle token refresh
- [ ] Error handler shows user-friendly messages
- [ ] React Query caches responses
- [ ] Components use `useQuery` / `useMutation`
- [ ] Loading states show spinners
- [ ] Error states show fallbacks

### Backend Development

- [ ] All endpoints return standard JSON format
- [ ] Error responses include error code + message
- [ ] CORS headers allow frontend domain
- [ ] Auth middleware verifies JWT tokens
- [ ] 401 responses trigger token refresh on client
- [ ] Rate limiting on sensitive endpoints
- [ ] Request logging includes full context

### Integration Testing

- [ ] Login flow: register → login → access protected endpoint
- [ ] Article CRUD: create → read → update → delete
- [ ] Comments: create → edit → delete
- [ ] Search: query → results → pagination
- [ ] Error handling: 400 → validation message, 500 → generic error
- [ ] Auth refresh: token expires → request refresh → retry original

---

**Document Version**: 1.0  
**Ready for**: Sprint 1+ (Ongoing)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
