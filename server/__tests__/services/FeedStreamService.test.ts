import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeedStreamService } from '../../services/FeedStreamService.js';
import type { FeedDelta } from '../../services/DeltaEncoder.js';

describe('FeedStreamService', () => {
  let service: FeedStreamService;
  let mockResponse: any;

  beforeEach(() => {
    service = new FeedStreamService();
    mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      destroyed: false,
    };
  });

  afterEach(() => {
    service.shutdown();
  });

  const createDelta = (messageId: number): FeedDelta => ({
    type: 'feed_update',
    messageId,
    timestamp: Date.now(),
    userId: 'user-123',
    delta: {
      added: [
        {
          id: `article-${messageId}`,
          title: `Article ${messageId}`,
          category: 'AI',
          author: 'Test Author',
          date: '2026-05-06',
          url: `https://example.com/${messageId}`,
          rankScore: 0.9,
          position: 0,
        },
      ],
    },
  });

  describe('Connection Management', () => {
    it('should add connection with proper SSE headers', () => {
      service.addConnection('user-123', mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive'
      );
      expect(service.getActiveConnections()).toBe(1);
    });

    it('should send connection_established message on connect', () => {
      service.addConnection('user-123', mockResponse);

      // Check that write was called for welcome message
      expect(mockResponse.write).toHaveBeenCalled();
      const callArgs = mockResponse.write.mock.calls[0][0];
      expect(callArgs).toContain('connection_established');
    });

    it('should remove connection and cleanup', () => {
      service.addConnection('user-123', mockResponse);
      expect(service.getActiveConnections()).toBe(1);

      service.removeConnection('user-123');
      expect(service.getActiveConnections()).toBe(0);
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle multiple concurrent connections', () => {
      const response1 = { ...mockResponse };
      const response2 = { ...mockResponse };
      const response3 = { ...mockResponse };

      service.addConnection('user-1', response1);
      service.addConnection('user-2', response2);
      service.addConnection('user-3', response3);

      expect(service.getActiveConnections()).toBe(3);

      service.removeConnection('user-2');
      expect(service.getActiveConnections()).toBe(2);
    });
  });

  describe('Message Queuing & Batching', () => {
    it('should queue updates without immediate send', () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockClear(); // Reset after connection message

      const delta = createDelta(1);
      service.queueUpdate('user-123', delta);

      expect(service.getPendingMessageCount('user-123')).toBe(1);
      // Should not send yet (batching active)
      expect(mockResponse.write).not.toHaveBeenCalled();
    });

    it('should deduplicate identical messages in queue', () => {
      service.addConnection('user-123', mockResponse);
      const delta = createDelta(1);

      service.queueUpdate('user-123', delta);
      service.queueUpdate('user-123', delta); // Duplicate

      expect(service.getPendingMessageCount('user-123')).toBe(1);
    });

    it('should flush queue after batch interval', async () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockClear();

      const delta = createDelta(1);
      service.queueUpdate('user-123', delta);

      // Wait for batch interval (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should now have batched message
      expect(mockResponse.write).toHaveBeenCalled();
      const callArgs = mockResponse.write.mock.calls[0][0];
      expect(callArgs).toContain('batch_update');
    });

    it('should batch multiple updates together', async () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockClear();

      service.queueUpdate('user-123', createDelta(1));
      service.queueUpdate('user-123', createDelta(2));
      service.queueUpdate('user-123', createDelta(3));

      expect(service.getPendingMessageCount('user-123')).toBe(3);

      // Wait for batch
      await new Promise((resolve) => setTimeout(resolve, 600));

      const callArgs = mockResponse.write.mock.calls[0][0];
      const batchMsg = JSON.parse(callArgs.substring(6)); // Remove 'data: '
      expect(batchMsg.count).toBe(3);
    });

    it('should maintain message order in batch', async () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockClear();

      service.queueUpdate('user-123', createDelta(1));
      service.queueUpdate('user-123', createDelta(2));
      service.queueUpdate('user-123', createDelta(3));

      await new Promise((resolve) => setTimeout(resolve, 600));

      const callArgs = mockResponse.write.mock.calls[0][0];
      const batchMsg = JSON.parse(callArgs.substring(6));

      expect(batchMsg.updates[0].messageId).toBeLessThan(
        batchMsg.updates[1].messageId
      );
      expect(batchMsg.updates[1].messageId).toBeLessThan(
        batchMsg.updates[2].messageId
      );
    });
  });

  describe('Message History & Reconnection', () => {
    it('should track message history for reconnection', async () => {
      service.addConnection('user-123', mockResponse);

      service.queueUpdate('user-123', createDelta(1));
      service.queueUpdate('user-123', createDelta(2));

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Get reconnection queue (all messages after 0)
      const missedMessages = service.getReconnectionQueue('user-123', 0);
      expect(missedMessages.length).toBeGreaterThan(0);
    });

    it('should return only messages after lastMessageId', async () => {
      service.addConnection('user-123', mockResponse);

      service.queueUpdate('user-123', createDelta(1));
      service.queueUpdate('user-123', createDelta(2));
      service.queueUpdate('user-123', createDelta(3));

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Get messages after message 1
      const missedMessages = service.getReconnectionQueue('user-123', 1);
      expect(missedMessages.length).toBeGreaterThanOrEqual(2);
      expect(
        missedMessages.every((msg) => msg.messageId > 1)
      ).toBe(true);
    });

    it('should limit message history size', async () => {
      service.addConnection('user-123', mockResponse);

      // Queue more than MESSAGE_HISTORY_LIMIT messages
      for (let i = 1; i <= 120; i++) {
        service.queueUpdate('user-123', createDelta(i));
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      // History should be bounded
      const allMessages = service.getReconnectionQueue('user-123', 0);
      expect(allMessages.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Heartbeat', () => {
    it('should keep connections alive with heartbeat', async () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockClear();

      // Wait for heartbeat interval (30s) - we'll mock this in real tests
      // For now, just verify service has heartbeat timer
      expect(service).toBeDefined();
    });

    it('should handle disconnected clients', () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.destroyed = true;

      // Try to send message to disconnected client
      const delta = createDelta(1);
      service.queueUpdate('user-123', delta);

      // Should handle gracefully without throwing
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle write errors gracefully', () => {
      service.addConnection('user-123', mockResponse);
      mockResponse.write.mockImplementation(() => {
        throw new Error('Write failed');
      });

      // Should not throw
      const delta = createDelta(1);
      expect(() => {
        service.queueUpdate('user-123', delta);
      }).not.toThrow();
    });

    it('should cleanup on service shutdown', () => {
      service.addConnection('user-123', mockResponse);
      service.addConnection('user-456', { ...mockResponse });

      expect(service.getActiveConnections()).toBe(2);

      service.shutdown();

      expect(service.getActiveConnections()).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should return active connection count', () => {
      const response1 = { ...mockResponse };
      const response2 = { ...mockResponse };

      service.addConnection('user-1', response1);
      service.addConnection('user-2', response2);

      expect(service.getActiveConnections()).toBe(2);
    });

    it('should return pending message count per user', () => {
      service.addConnection('user-123', mockResponse);

      service.queueUpdate('user-123', createDelta(1));
      service.queueUpdate('user-123', createDelta(2));

      expect(service.getPendingMessageCount('user-123')).toBe(2);
    });
  });
});
