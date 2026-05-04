/**
 * A/B Test Experiment Definitions
 * Central registry of all active experiments
 */

import type { ABExperiment } from '@/lib/ab-testing';

/**
 * Experiment 1: Home Feed Layout
 * Tests whether users prefer:
 * - Variant A: "For You" (personalized feed based on preferences)
 * - Variant B: "Latest" (chronological feed, newest articles)
 */
export const feedLayoutExperiment: ABExperiment = {
  id: 'feed_layout_v1',
  name: 'Home Feed Layout',
  enabled: true,
  variants: ['personalized', 'chronological'],
  description: 'Test personalized vs chronological feed layout on home page',
};

/**
 * Experiment 2: Bookmark Button Copy
 * Tests whether users respond better to:
 * - Variant A: "Save for later" (action-oriented, future-focused)
 * - Variant B: "Add to reading list" (feature-focused, organizational)
 */
export const bookmarkCopyExperiment: ABExperiment = {
  id: 'bookmark_copy_v1',
  name: 'Bookmark Button Copy',
  enabled: true,
  variants: ['save_for_later', 'add_to_list'],
  description: 'Test bookmark button copy: "Save for later" vs "Add to reading list"',
};

/**
 * Get copy text for bookmark button based on variant
 */
export function getBookmarkCopyText(variant: string | null, bookmarked: boolean): string {
  if (!variant) {
    // Default: use "Favoritar"
    return bookmarked ? 'Favorito' : 'Favoritar';
  }

  if (variant === 'save_for_later') {
    return bookmarked ? 'Salvo' : 'Salvar para depois';
  } else if (variant === 'add_to_list') {
    return bookmarked ? 'Na lista' : 'Adicionar à lista';
  }

  return bookmarked ? 'Favorito' : 'Favoritar';
}

/**
 * Get aria label for bookmark button based on variant
 */
export function getBookmarkAriaLabel(
  variant: string | null,
  title: string,
  bookmarked: boolean
): string {
  if (!variant) {
    // Default
    return bookmarked
      ? `Remover "${title}" dos favoritos`
      : `Adicionar "${title}" aos favoritos`;
  }

  if (variant === 'save_for_later') {
    return bookmarked ? `Remover "${title}" de salvos` : `Salvar "${title}" para depois`;
  } else if (variant === 'add_to_list') {
    return bookmarked ? `Remover "${title}" da lista` : `Adicionar "${title}" à lista`;
  }

  return bookmarked
    ? `Remover "${title}" dos favoritos`
    : `Adicionar "${title}" aos favoritos`;
}

/**
 * Get feedback text for bookmark button based on variant
 */
export function getBookmarkFeedbackText(variant: string | null, bookmarked: boolean): string {
  if (!variant) {
    // Default
    return bookmarked ? 'Adicionado aos favoritos' : 'Removido dos favoritos';
  }

  if (variant === 'save_for_later') {
    return bookmarked ? 'Salvo para depois' : 'Removido dos salvos';
  } else if (variant === 'add_to_list') {
    return bookmarked ? 'Adicionado à lista' : 'Removido da lista';
  }

  return bookmarked ? 'Adicionado aos favoritos' : 'Removido dos favoritos';
}

/**
 * List of all active experiments
 */
export const allExperiments: ABExperiment[] = [feedLayoutExperiment, bookmarkCopyExperiment];
