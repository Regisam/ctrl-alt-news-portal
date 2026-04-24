# REST API Specification — 25+ Endpoints
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Base URL**: `/api/v1` (or `https://api.ctrlaltnews.com/v1` in production)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Article Endpoints](#article-endpoints)
3. [Comment Endpoints](#comment-endpoints)
4. [User Endpoints](#user-endpoints)
5. [Category Endpoints](#category-endpoints)
6. [Search & Discovery](#search--discovery)
7. [Bookmark & Reaction Endpoints](#bookmark--reaction-endpoints)
8. [Admin Endpoints](#admin-endpoints)
9. [Contact Endpoint](#contact-endpoint)
10. [Error Handling](#error-handling)
11. [Response Format Standards](#response-format-standards)

---

## Authentication Endpoints

### POST /auth/register

Register a new user account with email and password.

**Auth Required**: No  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Request Validation** (Zod):
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/),
  fullName: z.string().min(2).max(100)
});
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "cuser_123abc",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "createdAt": "2026-04-16T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email already in use"
      },
      {
        "field": "password",
        "message": "Password must contain uppercase, number, and special character"
      }
    ]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Notes**:
- Password must be hashed with bcrypt (cost factor 12)
- Trigger welcome email (in production)
- Set refresh token in httpOnly cookie

---

### POST /auth/login

Login with email and password, receive JWT tokens.

**Auth Required**: No  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cuser_123abc",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### POST /auth/oauth/google

Exchange Google OAuth token for JWT tokens.

**Auth Required**: No  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9...",
  "accessToken": "ya29.a0AVvZVeq..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cuser_google_456def",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "role": "USER",
    "avatarUrl": "https://lh3.googleusercontent.com/a/...",
    "isNewUser": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Notes**:
- Verify idToken with Google's public keys
- Create user if not exists (first-time login)
- Return `isNewUser: true` to trigger onboarding

---

### POST /auth/refresh-token

Refresh expired access token using refresh token.

**Auth Required**: No (refresh token in cookie)  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body** (empty or refresh token in httpOnly cookie):
```json
{}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token expired or invalid"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### POST /auth/logout

Invalidate refresh token (client-side clears access token).

**Auth Required**: Yes (Bearer token)  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body** (empty):
```json
{}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Article Endpoints

### GET /articles

List published articles with pagination, filtering, and sorting.

**Auth Required**: No  
**Method**: `GET`  
**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `category` (string, optional): Filter by category slug
- `sort` (string, default: "recent"): "recent", "trending", "oldest"
- `search` (string, optional): Client-side search string (for MVP)

**Example**:
```
GET /api/v1/articles?page=1&limit=20&category=ai&sort=recent
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123abc",
      "titleEn": "GPT-4 Breakthrough",
      "titlePt": "Avanço do GPT-4",
      "slug": "gpt-4-breakthrough",
      "excerptEn": "OpenAI releases GPT-4 with improved...",
      "excerptPt": "OpenAI lança GPT-4 com melhorias...",
      "featuredImageUrl": "https://cdn.example.com/image.jpg",
      "author": {
        "id": "cuser_123",
        "fullName": "Sarah Chen",
        "avatarUrl": "https://api.dicebear.com/...",
        "bio": "AI researcher"
      },
      "category": {
        "id": "ccat_ai",
        "nameEn": "Artificial Intelligence",
        "namePt": "Inteligência Artificial",
        "slug": "ai",
        "colorHex": "#06B6D4"
      },
      "readingTimeMinutes": 8,
      "viewCount": 2450,
      "commentsCount": 12,
      "publishedAt": "2026-04-15T14:30:00Z",
      "createdAt": "2026-04-15T14:30:00Z"
    }
    // ... more articles
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /articles/:id

Get single article with full content, comments, and metadata.

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `id` (string, required)

**Example**:
```
GET /api/v1/articles/cart_123abc
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart_123abc",
    "titleEn": "GPT-4 Breakthrough",
    "titlePt": "Avanço do GPT-4",
    "slug": "gpt-4-breakthrough",
    "excerptEn": "OpenAI releases GPT-4 with improved reasoning and multimodal capabilities.",
    "excerptPt": "OpenAI lança GPT-4 com melhorias na lógica e capacidades multimodais.",
    "contentEn": "## Introduction\n\nGPT-4 represents a...",
    "contentPt": "## Introdução\n\nO GPT-4 representa um...",
    "featuredImageUrl": "https://cdn.example.com/image.jpg",
    "author": {
      "id": "cuser_123",
      "fullName": "Sarah Chen",
      "avatarUrl": "https://api.dicebear.com/...",
      "bio": "AI researcher at OpenAI",
      "website": "https://sarahchen.dev"
    },
    "category": {
      "id": "ccat_ai",
      "nameEn": "Artificial Intelligence",
      "namePt": "Inteligência Artificial",
      "slug": "ai",
      "colorHex": "#06B6D4"
    },
    "tags": [
      { "id": "ctag_1", "name": "AI", "slug": "ai" },
      { "id": "ctag_2", "name": "OpenAI", "slug": "openai" }
    ],
    "readingTimeMinutes": 8,
    "viewCount": 2450,
    "commentsCount": 12,
    "yourReaction": {
      "type": "LIKE",
      "count": 1
    },
    "isBookmarked": false,
    "publishedAt": "2026-04-15T14:30:00Z",
    "createdAt": "2026-04-15T14:30:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Notes**:
- If `viewCount < 50`, return "trending soon"
- Include comments separately in comments endpoint
- Track view in `page_views` table

---

### GET /articles/:id/comments

Get all comments for an article (with nested replies).

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `id` (article ID)  
**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sort` (string, default: "recent"): "recent", "topRated"

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "ccom_456",
      "content": "Great article! The multimodal capabilities are impressive.",
      "author": {
        "id": "cuser_456",
        "fullName": "Alice Johnson",
        "avatarUrl": "https://api.dicebear.com/..."
      },
      "likes": 15,
      "replies": [
        {
          "id": "ccom_457",
          "content": "I agree! The reasoning is much better.",
          "author": {
            "id": "cuser_789",
            "fullName": "Bob Smith",
            "avatarUrl": "https://api.dicebear.com/..."
          },
          "likes": 3,
          "createdAt": "2026-04-15T16:00:00Z"
        }
      ],
      "createdAt": "2026-04-15T15:30:00Z"
    }
    // ... more comments
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "pages": 2
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### POST /articles/:id/comments

Create a new comment on an article.

**Auth Required**: Yes (Bearer token)  
**Method**: `POST`  
**Content-Type**: `application/json`  
**Path Parameters**: `id` (article ID)

**Request Body**:
```json
{
  "content": "Great article! The multimodal capabilities are impressive.",
  "parentId": null
}
```

**Validation**:
```typescript
const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional()
});
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "ccom_458",
    "content": "Great article!",
    "author": {
      "id": "cuser_123",
      "fullName": "You",
      "avatarUrl": "https://..."
    },
    "likes": 0,
    "createdAt": "2026-04-16T10:30:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Must be logged in to comment"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### PUT /comments/:id

Edit your own comment.

**Auth Required**: Yes (Bearer token)  
**Method**: `PUT`  
**Path Parameters**: `id` (comment ID)

**Request Body**:
```json
{
  "content": "Updated comment text"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ccom_456",
    "content": "Updated comment text",
    "updatedAt": "2026-04-16T10:35:00Z"
  },
  "timestamp": "2026-04-16T10:35:00Z"
}
```

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Can only edit your own comments"
  },
  "timestamp": "2026-04-16T10:35:00Z"
}
```

---

### DELETE /comments/:id

Delete your own comment (soft delete).

**Auth Required**: Yes (Bearer token)  
**Method**: `DELETE`  
**Path Parameters**: `id` (comment ID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Comment deleted successfully"
  },
  "timestamp": "2026-04-16T10:35:00Z"
}
```

---

### POST /articles (Admin Only)

Create a new article.

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "titleEn": "New Article Title",
  "titlePt": "Título do Novo Artigo",
  "excerptEn": "Brief description of the article",
  "excerptPt": "Breve descrição do artigo",
  "contentEn": "# Markdown content here...",
  "contentPt": "# Conteúdo em Markdown aqui...",
  "categoryId": "ccat_ai",
  "featuredImageUrl": "https://cdn.example.com/image.jpg",
  "status": "DRAFT",
  "publishedAt": null
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "cart_new123",
    "slug": "new-article-title",
    "titleEn": "New Article Title",
    "status": "DRAFT",
    "createdAt": "2026-04-16T10:30:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### PUT /articles/:id (Admin Only)

Update an existing article.

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `PUT`  
**Path Parameters**: `id` (article ID)

**Request Body** (any fields to update):
```json
{
  "titleEn": "Updated Title",
  "status": "PUBLISHED",
  "publishedAt": "2026-04-16T12:00:00Z"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart_123abc",
    "titleEn": "Updated Title",
    "status": "PUBLISHED",
    "updatedAt": "2026-04-16T10:40:00Z"
  },
  "timestamp": "2026-04-16T10:40:00Z"
}
```

---

### DELETE /articles/:id (Admin Only)

Archive (soft delete) an article.

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `DELETE`  
**Path Parameters**: `id` (article ID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Article archived successfully"
  },
  "timestamp": "2026-04-16T10:40:00Z"
}
```

---

## User Endpoints

### GET /users/me

Get current logged-in user profile.

**Auth Required**: Yes (Bearer token)  
**Method**: `GET`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cuser_123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "username": "johndoe",
    "bio": "Tech enthusiast",
    "avatarUrl": "https://api.dicebear.com/...",
    "role": "USER",
    "createdAt": "2026-04-01T10:00:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### PUT /users/me

Update current user profile.

**Auth Required**: Yes (Bearer token)  
**Method**: `PUT`

**Request Body**:
```json
{
  "fullName": "Jane Doe",
  "bio": "AI researcher and writer",
  "avatarUrl": "https://cdn.example.com/avatar.jpg"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cuser_123",
    "fullName": "Jane Doe",
    "bio": "AI researcher and writer",
    "updatedAt": "2026-04-16T10:40:00Z"
  },
  "timestamp": "2026-04-16T10:40:00Z"
}
```

---

### GET /users/:id

Get public user profile (articles authored, bio, etc.).

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `id` (user ID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cuser_123",
    "fullName": "Sarah Chen",
    "bio": "AI researcher",
    "avatarUrl": "https://api.dicebear.com/...",
    "articlesCount": 24,
    "followerCount": 1250,
    "createdAt": "2026-01-01T10:00:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /users/:id/articles

Get all published articles by a specific user.

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `id` (user ID)  
**Query Parameters**: `page`, `limit`, `sort`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123",
      "titleEn": "Article 1",
      "slug": "article-1",
      "viewCount": 250,
      "publishedAt": "2026-04-15T14:30:00Z"
    }
    // ... more articles
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 24,
    "pages": 2
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Category Endpoints

### GET /categories

List all categories.

**Auth Required**: No  
**Method**: `GET`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "ccat_ai",
      "nameEn": "Artificial Intelligence",
      "namePt": "Inteligência Artificial",
      "slug": "ai",
      "colorHex": "#06B6D4",
      "descriptionEn": "Latest in AI and machine learning...",
      "articlesCount": 45
    },
    {
      "id": "ccat_science",
      "nameEn": "Science",
      "namePt": "Ciência",
      "slug": "science",
      "colorHex": "#A855F7",
      "articlesCount": 38
    },
    // ... more categories
  ],
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /categories/:slug/articles

List all articles in a specific category.

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `slug` (category slug, e.g., "ai")  
**Query Parameters**: `page`, `limit`, `sort`

**Example**:
```
GET /api/v1/categories/ai/articles?page=1&limit=20&sort=recent
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123abc",
      "titleEn": "GPT-4 Breakthrough",
      "slug": "gpt-4-breakthrough",
      "viewCount": 2450,
      "publishedAt": "2026-04-15T14:30:00Z"
    }
    // ... articles in category
  ],
  "category": {
    "id": "ccat_ai",
    "nameEn": "Artificial Intelligence",
    "colorHex": "#06B6D4"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Search & Discovery

### GET /search

Full-text search across articles (server-side or client-side for MVP).

**Auth Required**: No  
**Method**: `GET`  
**Query Parameters**:
- `q` (string, required): Search query
- `category` (string, optional): Filter by category slug
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Example**:
```
GET /api/v1/search?q=machine+learning&category=ai&page=1
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123",
      "titleEn": "Machine Learning Fundamentals",
      "excerpt": "Introduction to ML concepts...",
      "relevance": 0.95
    }
    // ... search results
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /trending

Get trending articles (by views in last 7 days).

**Auth Required**: No  
**Method**: `GET`  
**Query Parameters**: `limit` (default: 10)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123",
      "titleEn": "Breaking: New AI Model",
      "viewsInLast7Days": 1250,
      "rank": 1
    }
    // ... top 10 trending
  ],
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Bookmark & Reaction Endpoints

### POST /articles/:id/bookmark

Save an article to your bookmarks.

**Auth Required**: Yes (Bearer token)  
**Method**: `POST`  
**Path Parameters**: `id` (article ID)

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "cbm_456",
    "articleId": "cart_123",
    "createdAt": "2026-04-16T10:30:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### DELETE /articles/:id/bookmark

Remove an article from bookmarks.

**Auth Required**: Yes (Bearer token)  
**Method**: `DELETE`  
**Path Parameters**: `id` (article ID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Bookmark removed"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /users/me/bookmarks

Get current user's bookmarked articles.

**Auth Required**: Yes (Bearer token)  
**Method**: `GET`  
**Query Parameters**: `page`, `limit`

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123",
      "titleEn": "Article Title",
      "slug": "article-slug",
      "viewCount": 250,
      "bookmarkedAt": "2026-04-10T10:00:00Z"
    }
    // ... bookmarked articles
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### POST /articles/:id/reactions

Add or update a reaction (like/clap) on an article.

**Auth Required**: Yes (Bearer token)  
**Method**: `POST`  
**Path Parameters**: `id` (article ID)

**Request Body**:
```json
{
  "type": "LIKE",
  "count": 1
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "creact_789",
    "articleId": "cart_123",
    "type": "LIKE",
    "count": 1,
    "createdAt": "2026-04-16T10:30:00Z"
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /articles/:id/reactions

Get reaction counts for an article.

**Auth Required**: No  
**Method**: `GET`  
**Path Parameters**: `id` (article ID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "likes": 245,
    "claps": 1520,
    "yourReaction": {
      "type": "LIKE",
      "count": 1
    }
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Admin Endpoints

### GET /admin/articles (Admin Only)

List all articles (including drafts) with editorial status.

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `GET`  
**Query Parameters**: `page`, `limit`, `status` (DRAFT, PUBLISHED, ARCHIVED)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cart_123",
      "titleEn": "Article Title",
      "status": "PUBLISHED",
      "author": { "fullName": "Sarah Chen" },
      "viewCount": 2450,
      "publishedAt": "2026-04-15T14:30:00Z"
    }
    // ... all articles
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /admin/users (Admin Only)

List all users with role and activity stats.

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `GET`  
**Query Parameters**: `page`, `limit`, `role` (USER, AUTHOR, ADMIN)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cuser_123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "AUTHOR",
      "articlesCount": 5,
      "createdAt": "2026-04-01T10:00:00Z",
      "lastLoginAt": "2026-04-16T09:00:00Z"
    }
    // ... users
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

### GET /admin/analytics (Admin Only)

Get portal analytics (views, engagement, popular articles).

**Auth Required**: Yes (Bearer + ADMIN role)  
**Method**: `GET`  
**Query Parameters**: `period` (7d, 30d, 90d, 1y)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalViews": 45320,
      "uniqueUsers": 8420,
      "totalComments": 2340,
      "averageTimeOnSite": "3m 24s"
    },
    "topArticles": [
      {
        "id": "cart_123",
        "titleEn": "GPT-4 Breakthrough",
        "views": 2450,
        "comments": 45
      }
      // ... top 10 articles
    ],
    "topCategories": [
      {
        "id": "ccat_ai",
        "nameEn": "AI",
        "views": 18500
      }
      // ... categories
    ]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Contact Endpoint

### POST /contact

Submit a contact form inquiry.

**Auth Required**: No  
**Method**: `POST`  
**Content-Type**: `application/json`  
**Rate Limit**: 5 per IP per hour

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "topic": "Editorial",
  "subject": "Article Idea",
  "message": "I have a great idea for an article about..."
}
```

**Validation**:
```typescript
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  topic: z.enum(['Editorial', 'Press', 'Advertising', 'Other']),
  subject: z.string().min(5).max(100),
  message: z.string().min(10).max(5000)
});
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "ccon_123",
    "message": "Thank you! We've received your inquiry and will respond within 24 hours."
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many contact submissions. Please try again later.",
    "retryAfter": 3600
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error"
      }
    ]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists (e.g., email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error (log for debugging) |

---

## Response Format Standards

### Success Response

```json
{
  "success": true,
  "data": {
    // ... resource data or array of resources
  },
  "pagination": {
    // ... only for paginated endpoints
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

### Timestamps

- All timestamps in **ISO 8601 format** with UTC timezone: `2026-04-16T10:30:00Z`
- Client should convert to local timezone for display

### Pagination

- Always include `pagination` object for list endpoints
- Default limit: 20, max: 100
- `pages` = ceil(total / limit)

---

## Authentication Header

All authenticated endpoints require:

```
Authorization: Bearer {accessToken}
```

Example:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://api.ctrlaltnews.com/v1/users/me
```

---

## Implementation Checklist

- [ ] All 25+ endpoints documented above
- [ ] Error handling middleware (catches all errors, returns standard format)
- [ ] Request validation with Zod
- [ ] Authentication middleware (verify JWT)
- [ ] Authorization middleware (check roles)
- [ ] Rate limiting middleware (global + per-user)
- [ ] CORS configuration (allow frontend origin only)
- [ ] Request logging (Winston or Pino)
- [ ] Response compression (gzip)
- [ ] Security headers (Helmet.js)
- [ ] Unit tests for critical paths
- [ ] API documentation (Swagger/OpenAPI optional)

---

**Document Version**: 1.0  
**Ready for**: Story 1.3+ (API Routes & Endpoint Implementation)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
