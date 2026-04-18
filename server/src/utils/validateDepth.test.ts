import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateDepth } from './validateDepth';
import { prisma } from '../prisma';

describe('validateDepth', () => {
  const mockCommentId = 'test-parent-123';
  const mockChildId = 'test-child-456';
  const mockGrandchildId = 'test-grandchild-789';

  beforeEach(async () => {
    // Create mock comments for testing
    await prisma.comment.create({
      data: {
        id: mockCommentId,
        content: 'Parent comment',
        articleId: 'article-1',
        authorId: 'author-1',
        parentId: null,
      },
    });

    await prisma.comment.create({
      data: {
        id: mockChildId,
        content: 'Child comment',
        articleId: 'article-1',
        authorId: 'author-2',
        parentId: mockCommentId,
      },
    });

    await prisma.comment.create({
      data: {
        id: mockGrandchildId,
        content: 'Grandchild comment',
        articleId: 'article-1',
        authorId: 'author-3',
        parentId: mockChildId,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.comment.deleteMany({
      where: {
        id: { in: [mockCommentId, mockChildId, mockGrandchildId] },
      },
    });
  });

  it('should validate depth for child comment (depth 1)', async () => {
    const result = await validateDepth(mockCommentId, 3);
    expect(result.valid).toBe(true);
    expect(result.depth).toBe(1);
  });

  it('should validate depth for grandchild comment (depth 2)', async () => {
    const result = await validateDepth(mockChildId, 3);
    expect(result.valid).toBe(true);
    expect(result.depth).toBe(2);
  });

  it('should reject when max depth reached', async () => {
    const result = await validateDepth(mockGrandchildId, 3);
    expect(result.valid).toBe(false);
    expect(result.depth).toBe(3);
    expect(result.error).toContain('Maximum nesting level');
  });

  it('should return error for non-existent parent', async () => {
    const result = await validateDepth('non-existent-id', 3);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Parent comment not found');
  });

  it('should allow depth 2 with maxDepth 3', async () => {
    const result = await validateDepth(mockChildId, 3);
    expect(result.valid).toBe(true);
  });
});
