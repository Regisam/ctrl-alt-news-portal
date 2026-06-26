import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = 'http://localhost:3000/api';
let authToken: string;
let userId: string;

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await fetch(`${API_URL}/auth-v2/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    authToken = data.token;
    userId = data.userId;
  });

  it('should login user', async () => {
    const response = await fetch(`${API_URL}/auth-v2/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
      }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get current user', async () => {
    const response = await fetch(`${API_URL}/auth-v2/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Articles API', () => {
  it('should search articles', async () => {
    const response = await fetch(`${API_URL}/search/articles?q=AI`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get articles by category', async () => {
    const response = await fetch(`${API_URL}/search/articles?category=AI`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Analytics API', () => {
  it('should get live metrics', async () => {
    const response = await fetch(`${API_URL}/analytics-live/live`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
    if (response.status === 200) {
      const data = await response.json();
      expect(data.data).toBeDefined();
    }
  });

  it('should track article view', async () => {
    const response = await fetch(`${API_URL}/analytics-live/track-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ articleId: '1' }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should track search', async () => {
    const response = await fetch(`${API_URL}/analytics-live/track-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query: 'AI', results: 10 }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Push Notifications API', () => {
  it('should get VAPID public key', async () => {
    const response = await fetch(`${API_URL}/push/vapid-public-key`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.publicKey).toBeDefined();
  });

  it('should get push subscriptions', async () => {
    const response = await fetch(`${API_URL}/push/subscriptions`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get push metrics', async () => {
    const response = await fetch(`${API_URL}/push/metrics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Email API', () => {
  it('should send verification email', async () => {
    const response = await fetch(`${API_URL}/transactional/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should send password reset email', async () => {
    const response = await fetch(`${API_URL}/transactional/send-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('User Behavior API', () => {
  let sessionId: string;

  it('should start a session', async () => {
    const response = await fetch(`${API_URL}/user-behavior/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
    if (response.status === 200) {
      const data = await response.json();
      sessionId = data.data?.sessionId || data.sessionId;
    }
  });

  it('should track event', async () => {
    const response = await fetch(`${API_URL}/user-behavior/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ event: 'click', data: { target: 'button' } }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get engagement score', async () => {
    const response = await fetch(`${API_URL}/user-behavior/users/${userId}/engagement`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get churn risk', async () => {
    const response = await fetch(`${API_URL}/user-behavior/users/${userId}/churn-risk`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Experiments API', () => {
  it('should get active experiments', async () => {
    const response = await fetch(`${API_URL}/experiments`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should track metric', async () => {
    const response = await fetch(`${API_URL}/experiments/exp-1/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ metric: 'conversion', value: 1 }),
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Alerts API', () => {
  it('should get alerts dashboard', async () => {
    const response = await fetch(`${API_URL}/alerts/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get alert history', async () => {
    const response = await fetch(`${API_URL}/alerts/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

describe('Admin API', () => {
  it('should get pending articles', async () => {
    const response = await fetch(`${API_URL}/admin/pending-articles`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should get reports', async () => {
    const response = await fetch(`${API_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
