import { renderHook, act } from '@testing-library/react';
import { useReactions } from '@/hooks/useReactions';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useReactions hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty reactions', () => {
    const { result } = renderHook(() => useReactions());
    expect(result.current.reactions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should add a reaction', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.reactions).toHaveLength(1);
    expect(result.current.reactions[0]).toEqual(
      expect.objectContaining({
        articleId: 'article-1',
        userId: 'user-1',
        type: 'like',
      })
    );
  });

  it('should remove a reaction', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.reactions).toHaveLength(1);

    act(() => {
      result.current.removeReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.reactions).toHaveLength(0);
  });

  it('should toggle reaction on and off', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.toggleReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.reactions).toHaveLength(1);

    act(() => {
      result.current.toggleReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.reactions).toHaveLength(0);
  });

  it('should get reaction counts by article', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
      result.current.addReaction('article-1', 'user-2', 'like');
      result.current.addReaction('article-1', 'user-3', 'clap');
    });

    const counts = result.current.getReactionsByArticle('article-1');
    expect(counts).toEqual({
      like: 2,
      clap: 1,
      total: 3,
    });
  });

  it('should return 0 counts for article with no reactions', () => {
    const { result } = renderHook(() => useReactions());

    const counts = result.current.getReactionsByArticle('article-1');
    expect(counts).toEqual({
      like: 0,
      clap: 0,
      total: 0,
    });
  });

  it('should get user reaction for an article', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
    });

    const userReaction = result.current.getUserReaction('article-1', 'user-1');
    expect(userReaction).toBe('like');
  });

  it('should return null if user has no reaction', () => {
    const { result } = renderHook(() => useReactions());

    const userReaction = result.current.getUserReaction('article-1', 'user-1');
    expect(userReaction).toBeNull();
  });

  it('should persist reactions to localStorage', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
    });

    const stored = localStorage.getItem('ctrl-alt-reactions');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('should load reactions from localStorage on mount', () => {
    const reaction = {
      articleId: 'article-1',
      userId: 'user-1',
      type: 'like' as const,
      timestamp: Date.now(),
    };

    localStorage.setItem('ctrl-alt-reactions', JSON.stringify([reaction]));

    const { result } = renderHook(() => useReactions());

    expect(result.current.reactions).toHaveLength(1);
    expect(result.current.reactions[0]).toEqual(reaction);
  });

  it('should handle localStorage errors gracefully', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage full');
    });

    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
    });

    expect(result.current.error).toBe('Storage full');

    localStorage.setItem = originalSetItem;
  });

  it('should clear all reactions', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
      result.current.addReaction('article-2', 'user-1', 'clap');
    });

    expect(result.current.reactions).toHaveLength(2);

    act(() => {
      result.current.clearReactions();
    });

    expect(result.current.reactions).toHaveLength(0);
    expect(localStorage.getItem('ctrl-alt-reactions')).toBe('[]');
  });

  it('should return all reactions', () => {
    const { result } = renderHook(() => useReactions());

    act(() => {
      result.current.addReaction('article-1', 'user-1', 'like');
      result.current.addReaction('article-1', 'user-2', 'clap');
    });

    const all = result.current.getAllReactions();
    expect(all).toHaveLength(2);
  });
});
