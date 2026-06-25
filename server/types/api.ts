// AC1: Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  path?: string;
  statusCode: number;
}

// AC2: Common DTO types
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ArticleDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  published: boolean;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  content: string;
  articleId: string;
  userId: string;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ProfileDTO {
  userId: string;
  displayName: string;
  bio: string;
  privacy: string;
  createdAt: string;
}

// AC6: HTTP Status Code mapping
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// AC4: Error types
export interface ApiError {
  statusCode: HttpStatus;
  message: string;
  details?: Record<string, unknown>;
}

// AC5: Validation result
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  data?: unknown;
}
