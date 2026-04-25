import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GSCClient } from '../../lib/gsc-client';

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({})),
    },
    searchconsole: vi.fn().mockReturnValue({
      searchanalytics: {
        query: vi.fn(),
      },
    }),
  },
}));

describe('GSCClient', () => {
  let client: GSCClient;
  const mockCredentials = {
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCA==\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: '1234567890',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  beforeEach(() => {
    client = new GSCClient(mockCredentials);
  });

  it('should create GSCClient instance', () => {
    expect(client).toBeDefined();
  });

  it('should have getTopQueries method', () => {
    expect(client.getTopQueries).toBeDefined();
  });

  it('should have getTopPages method', () => {
    expect(client.getTopPages).toBeDefined();
  });

  it('should have getAggregateMetrics method', () => {
    expect(client.getAggregateMetrics).toBeDefined();
  });

  it('should return empty array on getTopQueries error', async () => {
    const result = await client.getTopQueries('https://example.com');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array on getTopPages error', async () => {
    const result = await client.getTopPages('https://example.com');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return default metrics on getAggregateMetrics error', async () => {
    const result = await client.getAggregateMetrics('https://example.com');
    expect(result).toEqual({
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    });
  });
});
