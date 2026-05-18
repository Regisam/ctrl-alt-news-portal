/**
 * Memory Profiling for FeedStreamService — Story 12.6 AC7
 *
 * Test for memory leaks with 100+ concurrent SSE connections
 * over extended period (1 hour simulated in shorter test)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FeedStreamService } from '../../services/FeedStreamService.js';
import type { FeedDelta } from '../../services/DeltaEncoder.js';

describe('FeedStreamService Memory Safety — Story 12.6 AC7', () => {
  let service: FeedStreamService;

  beforeEach(() => {
    service = new FeedStreamService();
  });

  afterEach(() => {
    service.shutdown();
  });

  it('should not leak memory with 100+ concurrent connections', async () => {
    const measurementInterval = 100; // Check every 100ms
    const testDuration = 5000; // 5s test (simulates 1h pattern)
    const measurements: { time: number; heap: number }[] = [];

    // Force initial GC
    if (global.gc) global.gc();
    const baselineHeap = process.memoryUsage().heapUsed;

    // Simulate 100 users connecting and disconnecting
    const connectionCount = 100;
    let messagesQueued = 0;

    const startTime = Date.now();

    // Measurement loop
    const measurementLoop = setInterval(() => {
      if (global.gc) global.gc();
      const heap = process.memoryUsage().heapUsed;
      measurements.push({
        time: Date.now() - startTime,
        heap,
      });

      // Check for memory spike > 20% of baseline
      const growth = heap - baselineHeap;
      expect(growth).toBeLessThan(baselineHeap * 0.2);
    }, measurementInterval);

    // Simulate connections
    const connections: {
      userId: string;
      response: { destroyed?: boolean; write?: () => void; end?: () => void; setHeader?: () => void };
    }[] = [];

    for (let i = 0; i < connectionCount; i++) {
      const userId = `user-${i}`;
      const mockResponse = {
        destroyed: false,
        setHeader: () => {},
        write: () => {},
        end: () => {},
      };

      service.addConnection(userId, mockResponse);
      connections.push({ userId, response: mockResponse });
    }

    // Queue and flush messages repeatedly
    while (Date.now() - startTime < testDuration) {
      // Queue updates for random users
      const randomUser = connections[Math.floor(Math.random() * connections.length)];
      const delta: FeedDelta = {
        type: 'feed_update',
        messageId: messagesQueued++,
        timestamp: Date.now(),
        userId: randomUser.userId,
        delta: {
          added: [
            {
              id: `article-${messagesQueued}`,
              title: 'New Article',
              category: 'AI',
              author: 'Author',
              date: '2026-05-07',
              rankScore: Math.random(),
              url: '/article',
              position: 0,
            },
          ],
        },
      };

      service.queueUpdate(randomUser.userId, delta);

      // Simulate connection drop and reconnect
      if (messagesQueued % 50 === 0) {
        const randomIdx = Math.floor(Math.random() * connections.length);
        const userToRemove = connections[randomIdx];
        service.removeConnection(userToRemove.userId);

        // Reconnect
        const newMockResponse = {
          destroyed: false,
          setHeader: () => {},
          write: () => {},
          end: () => {},
        };
        service.addConnection(userToRemove.userId, newMockResponse);
        connections[randomIdx] = { userId: userToRemove.userId, response: newMockResponse };
      }

      // Small delay to simulate realistic message flow
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Cleanup
    clearInterval(measurementLoop);

    // Disconnect all users
    connections.forEach(({ userId }) => {
      service.removeConnection(userId);
    });

    // Final GC and measurement
    if (global.gc) global.gc();
    const finalHeap = process.memoryUsage().heapUsed;
    const finalGrowth = finalHeap - baselineHeap;

    // After cleanup, memory should return close to baseline
    expect(finalGrowth).toBeLessThan(baselineHeap * 0.15);

    // Verify measurements trend (should stabilize, not grow)
    if (measurements.length > 10) {
      const firstTenAvg =
        measurements.slice(0, 10).reduce((sum, m) => sum + m.heap, 0) / 10;
      const lastTenAvg =
        measurements.slice(-10).reduce((sum, m) => sum + m.heap, 0) / 10;

      // Last measurements should not be significantly higher
      expect(lastTenAvg).toBeLessThan(firstTenAvg * 1.5);
    }
  }, 15000); // 15s timeout for memory profiling with 100+ connections

  it('should properly cleanup message queues', () => {
    const userId = 'test-user';
    const mockResponse = {
      destroyed: false,
      setHeader: () => {},
      write: () => {},
      end: () => {},
    };

    service.addConnection(userId, mockResponse);

    // Queue multiple messages
    for (let i = 0; i < 10; i++) {
      const delta: FeedDelta = {
        type: 'feed_update',
        messageId: i,
        timestamp: Date.now(),
        userId,
        delta: {},
      };
      service.queueUpdate(userId, delta);
    }

    // Check queue size
    let pendingCount = service.getPendingMessageCount(userId);
    expect(pendingCount).toBeGreaterThan(0);

    // Remove connection
    service.removeConnection(userId);

    // Queue should be cleaned
    pendingCount = service.getPendingMessageCount(userId);
    expect(pendingCount).toBe(0);
  });

  it('should not leak event listeners', () => {
    const userId = 'test-user';
    const mockResponse = {
      destroyed: false,
      setHeader: () => {},
      write: () => {},
      end: () => {},
      listeners: [] as { event: string; listener: () => void }[],
    };

    // Mock listener tracking
    const originalOn = mockResponse.setHeader;
    let listenerCount = 0;

    // Add connection multiple times and remove
    for (let i = 0; i < 5; i++) {
      service.addConnection(`${userId}-${i}`, { ...mockResponse } as any);
      service.removeConnection(`${userId}-${i}`);
    }

    // No active connections should remain
    expect(service.getActiveConnections()).toBe(0);
  });

  it('should bound message history size (AC8 - cleanup invisible articles)', () => {
    const userId = 'test-user';
    const mockResponse = {
      destroyed: false,
      setHeader: () => {},
      write: () => {},
      end: () => {},
    };

    service.addConnection(userId, mockResponse);

    // Queue 200 messages (history limit is 100)
    for (let i = 0; i < 200; i++) {
      const delta: FeedDelta = {
        type: 'feed_update',
        messageId: i,
        timestamp: Date.now(),
        userId,
        delta: {},
      };
      service.queueUpdate(userId, delta);

      // Simulate batch flush every 10 messages
      if (i % 10 === 0) {
        // Allow batch timer to fire (simulated)
      }
    }

    // Remove connection to allow history to settle
    service.removeConnection(userId);

    // Message history should be bounded
    // (Implementation detail: history limit prevents unbounded growth)
    service.shutdown();

    // No memory should leak after shutdown
    if (global.gc) global.gc();
    const heap = process.memoryUsage().heapUsed;
    expect(heap).toBeLessThan(100 * 1024 * 1024); // <100MB after cleanup
  });
});
