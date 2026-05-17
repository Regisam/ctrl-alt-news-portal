import { renderHook, act } from '@testing-library/react';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { storageAuthorFollow } from '@/lib/storage';
import { describe, it, expect, beforeEach } from 'vitest';

describe('useAuthorFollow hook', () => {
  beforeEach(() => {
    storageAuthorFollow.clear();
  });

  it('should initialize with empty followed authors', () => {
    const { result } = renderHook(() => useAuthorFollow());

    expect(result.current.followedAuthors).toEqual([]);
  });

  it('should follow an author', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
    });

    expect(result.current.isFollowing('Alex Chen')).toBe(true);
    expect(result.current.followedAuthors).toContain('Alex Chen');
  });

  it('should unfollow an author', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
    });
    expect(result.current.isFollowing('Alex Chen')).toBe(true);

    act(() => {
      result.current.unfollowAuthor('Alex Chen');
    });

    expect(result.current.isFollowing('Alex Chen')).toBe(false);
    expect(result.current.followedAuthors).not.toContain('Alex Chen');
  });

  it('should toggle follow for an author', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.toggleFollow('Alex Chen');
    });
    expect(result.current.isFollowing('Alex Chen')).toBe(true);

    act(() => {
      result.current.toggleFollow('Alex Chen');
    });
    expect(result.current.isFollowing('Alex Chen')).toBe(false);
  });

  it('should handle following multiple authors', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
      result.current.followAuthor('James Wright');
      result.current.followAuthor('Dr. Sarah Kim');
    });

    expect(result.current.followedAuthors).toHaveLength(3);
    expect(result.current.isFollowing('Alex Chen')).toBe(true);
    expect(result.current.isFollowing('James Wright')).toBe(true);
    expect(result.current.isFollowing('Dr. Sarah Kim')).toBe(true);
  });

  it('should not duplicate when following same author twice', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
      result.current.followAuthor('Alex Chen');
    });

    expect(result.current.followedAuthors).toHaveLength(1);
  });

  it('should persist followed authors to localStorage', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
      result.current.followAuthor('James Wright');
    });

    const stored = storageAuthorFollow.getAll();
    expect(stored).toHaveLength(2);
    expect(stored.some((item) => item.authorName === 'Alex Chen')).toBe(true);
    expect(stored.some((item) => item.authorName === 'James Wright')).toBe(true);
  });

  it('should recover followed authors from localStorage', () => {
    // First hook instance
    const { result: result1 } = renderHook(() => useAuthorFollow());
    act(() => {
      result1.current.followAuthor('Alex Chen');
    });

    // Second hook instance (simulates page reload)
    const { result: result2 } = renderHook(() => useAuthorFollow());

    expect(result2.current.followedAuthors).toContain('Alex Chen');
    expect(result2.current.isFollowing('Alex Chen')).toBe(true);
  });

  it('should order followed authors by date (most recent first)', () => {
    storageAuthorFollow.follow('Alex Chen');
    // Wait a tiny bit to ensure different timestamps
    const result1 = storageAuthorFollow.follow('James Wright');

    expect(result1.items[0].authorName).toBe('James Wright');
    expect(result1.items[1].authorName).toBe('Alex Chen');
  });

  it('should return true for isFollowing an existing author', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
    });

    expect(result.current.isFollowing('Alex Chen')).toBe(true);
  });

  it('should return false for isFollowing a non-followed author', () => {
    const { result } = renderHook(() => useAuthorFollow());

    expect(result.current.isFollowing('Non-existent Author')).toBe(false);
  });

  it('should handle unfollowing a non-followed author gracefully', () => {
    const { result } = renderHook(() => useAuthorFollow());

    expect(() => {
      act(() => {
        result.current.unfollowAuthor('Non-existent Author');
      });
    }).not.toThrow();

    expect(result.current.followedAuthors).toHaveLength(0);
  });

  it('should update state immediately on follow/unfollow', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
    });
    expect(result.current.followedAuthors).toContain('Alex Chen');

    act(() => {
      result.current.unfollowAuthor('Alex Chen');
    });
    expect(result.current.followedAuthors).not.toContain('Alex Chen');
  });

  it('should handle rapid toggle operations', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.toggleFollow('Alex Chen');
      result.current.toggleFollow('Alex Chen');
      result.current.toggleFollow('Alex Chen');
    });

    expect(result.current.isFollowing('Alex Chen')).toBe(true);
  });

  it('should return all followed authors', () => {
    const { result } = renderHook(() => useAuthorFollow());

    act(() => {
      result.current.followAuthor('Alex Chen');
      result.current.followAuthor('James Wright');
    });

    expect(result.current.followedAuthors).toEqual(
      expect.arrayContaining(['Alex Chen', 'James Wright'])
    );
  });
});
