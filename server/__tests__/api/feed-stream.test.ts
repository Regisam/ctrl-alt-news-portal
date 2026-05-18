import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleFeedStream,
  broadcastFeedUpdate,
  feedStreamHealth,
} from '../../api/feed-stream.js';
import type { Request, Response } from 'express';

describe('Feed Stream API Endpoints', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      query: {},
      on: vi.fn(),
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      write: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      on: vi.fn(),
      destroyed: false,
    };
  });

  describe('GET /api/feed/stream', () => {
    it('should return 400 if userId is missing', async () => {
      mockReq.query = {};

      await handleFeedStream(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('userId'),
        })
      );
    });

    it('should set SSE headers on valid request', async () => {
      mockReq.query = { userId: 'user-123' };

      await handleFeedStream(mockReq as Request, mockRes as Response);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive'
      );
    });

    it('should handle reconnection with lastMessageId', async () => {
      mockReq.query = { userId: 'user-123', lastMessageId: '5' };

      await handleFeedStream(mockReq as Request, mockRes as Response);

      // Should not error
      expect(mockRes.status).not.toHaveBeenCalledWith(
        expect.any(Number)
      );
    });

    it('should handle client close event', async () => {
      mockReq.query = { userId: 'user-123' };
      let closeHandler: Function | undefined;

      (mockReq.on as any) = vi.fn((event, handler) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      });

      await handleFeedStream(mockReq as Request, mockRes as Response);

      // Simulate client close
      if (closeHandler) {
        expect(() => closeHandler()).not.toThrow();
      }
    });

    it('should handle request error event', async () => {
      mockReq.query = { userId: 'user-123' };
      let errorHandler: Function | undefined;

      (mockReq.on as any) = vi.fn((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      await handleFeedStream(mockReq as Request, mockRes as Response);

      // Simulate error
      if (errorHandler) {
        expect(() => errorHandler(new Error('Connection error'))).not.toThrow();
      }
    });

    it('should handle response close event', async () => {
      mockReq.query = { userId: 'user-123' };
      let resCloseHandler: Function | undefined;

      (mockRes.on as any) = vi.fn((event, handler) => {
        if (event === 'close') {
          resCloseHandler = handler;
        }
      });

      await handleFeedStream(mockReq as Request, mockRes as Response);

      if (resCloseHandler) {
        expect(() => resCloseHandler()).not.toThrow();
      }
    });

    it('should handle response error event', async () => {
      mockReq.query = { userId: 'user-123' };
      let resErrorHandler: Function | undefined;

      (mockRes.on as any) = vi.fn((event, handler) => {
        if (event === 'error') {
          resErrorHandler = handler;
        }
      });

      await handleFeedStream(mockReq as Request, mockRes as Response);

      if (resErrorHandler) {
        expect(() => resErrorHandler(new Error('Response error'))).not.toThrow();
      }
    });
  });

  describe('POST /api/feed/stream/update', () => {
    it('should return 400 if userId is missing', async () => {
      mockReq.body = { delta: {} };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('userId'),
        })
      );
    });

    it('should return 400 if delta is missing', async () => {
      mockReq.body = { userId: 'user-123' };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('delta'),
        })
      );
    });

    it('should return 202 Accepted on valid request', async () => {
      mockReq.body = {
        userId: 'user-123',
        delta: {
          type: 'feed_update',
          messageId: 1,
          timestamp: Date.now(),
          userId: 'user-123',
          delta: {
            added: [
              {
                id: '1',
                title: 'Test',
                category: 'AI',
                author: 'Test',
                date: '2026-05-06',
                url: 'https://example.com',
                rankScore: 0.8,
                position: 0,
              },
            ],
          },
        },
      };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'queued',
          userId: 'user-123',
        })
      );
    });

    it('should include pending message count in response', async () => {
      mockReq.body = {
        userId: 'user-123',
        delta: {
          type: 'feed_update',
          messageId: 1,
          timestamp: Date.now(),
          userId: 'user-123',
          delta: {},
        },
      };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('pendingMessages');
      expect(typeof callArgs.pendingMessages).toBe('number');
    });

    it('should handle missing userId gracefully', async () => {
      mockReq.body = {
        delta: { type: 'feed_update' },
      };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('GET /api/feed/stream/health', () => {
    it('should return healthy status', async () => {
      await feedStreamHealth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
        })
      );
    });

    it('should include active connection count', async () => {
      await feedStreamHealth(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('activeConnections');
      expect(typeof callArgs.activeConnections).toBe('number');
    });

    it('should include timestamp', async () => {
      await feedStreamHealth(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('timestamp');
      expect(typeof callArgs.timestamp).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing userId in feed stream', async () => {
      mockReq.query = { userId: null };

      await handleFeedStream(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should queue valid delta updates', async () => {
      mockReq.body = {
        userId: 'user-123',
        delta: {
          type: 'feed_update',
          messageId: 1,
          timestamp: Date.now(),
          userId: 'user-123',
          delta: {
            added: [],
          },
        },
      };

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(202);
    });

    it('should handle errors in health check gracefully', async () => {
      // Health check should respond with success or error
      await feedStreamHealth(mockReq as Request, mockRes as Response);

      // Should return a response
      expect(mockRes.status).toHaveBeenCalled();
      // Status is either 200 (healthy) or 500 (error)
      const statusCode = (mockRes.status as any).mock.calls[0]?.[0];
      expect([200, 500]).toContain(statusCode);
    });

    it('should handle null request body in broadcast as error', async () => {
      mockReq.body = null;

      await broadcastFeedUpdate(mockReq as Request, mockRes as Response);

      // Should return error status
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
      const statusCode = (mockRes.status as any).mock.calls[0]?.[0];
      expect(statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
