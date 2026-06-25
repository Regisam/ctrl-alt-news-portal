const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Authentication
export const authAPI = {
  register: (email: string, password: string) =>
    apiCall('/auth-v2/register', {
      method: 'POST',
      body: { email, password },
    }),

  login: (email: string, password: string) =>
    apiCall('/auth-v2/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: () =>
    apiCall('/auth-v2/logout', { method: 'POST' }),

  getCurrentUser: () =>
    apiCall('/auth-v2/me', { method: 'GET' }),
};

// Articles
export const articlesAPI = {
  search: (query: string, limit = 20) =>
    apiCall(`/search/articles?q=${encodeURIComponent(query)}&limit=${limit}`),

  getByCategory: (category: string) =>
    apiCall(`/search/articles?category=${category}`),

  getById: (id: string) =>
    apiCall(`/search/articles/${id}`),
};

// Analytics
export const analyticsAPI = {
  getLiveMetrics: () =>
    apiCall('/analytics-live/live'),

  getTimeSeries: (metric: string, hours = 24) =>
    apiCall(`/analytics-live/time-series/${metric}?hours=${hours}`),

  getMetricsForDateRange: (startDate: string, endDate: string) =>
    apiCall(`/analytics-live/metrics?start=${startDate}&end=${endDate}`),

  trackArticleView: (articleId: string) =>
    apiCall('/analytics-live/track-view', {
      method: 'POST',
      body: { articleId },
    }),

  trackSearch: (query: string, results: number) =>
    apiCall('/analytics-live/track-search', {
      method: 'POST',
      body: { query, results },
    }),
};

// Push Notifications
export const pushAPI = {
  getVapidPublicKey: () =>
    apiCall('/push/vapid-public-key'),

  subscribe: (subscription: PushSubscription) =>
    apiCall('/push/subscribe', {
      method: 'POST',
      body: subscription,
    }),

  getSubscriptions: () =>
    apiCall('/push/subscriptions'),

  unsubscribe: (subscriptionId: string) =>
    apiCall(`/push/unsubscribe/${subscriptionId}`, {
      method: 'POST',
    }),

  sendTest: () =>
    apiCall('/push/test', { method: 'POST' }),

  getMetrics: () =>
    apiCall('/push/metrics'),
};

// Email
export const emailAPI = {
  sendDailyDigest: (preferences: any) =>
    apiCall('/digest/subscribe', {
      method: 'POST',
      body: preferences,
    }),

  requestVerification: (email: string) =>
    apiCall('/transactional/send-verification', {
      method: 'POST',
      body: { email },
    }),

  requestPasswordReset: (email: string) =>
    apiCall('/transactional/send-password-reset', {
      method: 'POST',
      body: { email },
    }),
};

// User Behavior
export const behaviorAPI = {
  startSession: (userId: string) =>
    apiCall('/user-behavior/sessions/start', {
      method: 'POST',
      body: { userId },
    }),

  endSession: (sessionId: string) =>
    apiCall(`/user-behavior/sessions/${sessionId}/end`, {
      method: 'POST',
    }),

  trackPageView: (sessionId: string, page: string) =>
    apiCall(`/user-behavior/sessions/${sessionId}/pageview`, {
      method: 'POST',
      body: { page },
    }),

  trackEvent: (event: string, data: any) =>
    apiCall('/user-behavior/events/track', {
      method: 'POST',
      body: { event, data },
    }),

  getEngagementScore: (userId: string) =>
    apiCall(`/user-behavior/users/${userId}/engagement`),

  getChurnRisk: (userId: string) =>
    apiCall(`/user-behavior/users/${userId}/churn-risk`),
};

// Experiments (A/B Testing)
export const experimentsAPI = {
  getActiveExperiments: () =>
    apiCall('/experiments'),

  getUserVariant: (userId: string, experimentId: string) =>
    apiCall(`/experiments/${experimentId}/assign?userId=${userId}`),

  trackMetric: (experimentId: string, metric: string, value: any) =>
    apiCall(`/experiments/${experimentId}/metrics`, {
      method: 'POST',
      body: { metric, value },
    }),

  getResults: (experimentId: string) =>
    apiCall(`/experiments/${experimentId}/results`),
};

// Alerts
export const alertsAPI = {
  getDashboard: () =>
    apiCall('/alerts/dashboard'),

  getAlertHistory: () =>
    apiCall('/alerts/history'),

  acknowledgeAlert: (alertId: string) =>
    apiCall(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),

  silenceAlert: (alertId: string, durationMinutes: number) =>
    apiCall(`/alerts/${alertId}/silence`, {
      method: 'POST',
      body: { durationMinutes },
    }),
};

// Admin
export const adminAPI = {
  getPendingArticles: () =>
    apiCall('/admin/pending-articles'),

  approveArticle: (articleId: string) =>
    apiCall(`/admin/articles/${articleId}/approve`, { method: 'POST' }),

  rejectArticle: (articleId: string, reason: string) =>
    apiCall(`/admin/articles/${articleId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  getReports: () =>
    apiCall('/admin/reports'),

  resolveReport: (reportId: string) =>
    apiCall(`/admin/reports/${reportId}/resolve`, { method: 'POST' }),
};

export default {
  authAPI,
  articlesAPI,
  analyticsAPI,
  pushAPI,
  emailAPI,
  behaviorAPI,
  experimentsAPI,
  alertsAPI,
  adminAPI,
};
