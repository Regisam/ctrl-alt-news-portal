// CTRL + ALT News — Shared Constants
// Single source of truth for category configuration
// Eliminates duplication between Sidebar.tsx and TrendingSection.tsx

import type { Category } from "./data";

export interface CategoryConfigEntry {
  /** CSS variable reference for the neon color */
  color: string;
  /** Human-readable label */
  label: string;
  /** CSS class suffix for card hover border glow */
  cardClass: string;
  /** Tailwind badge class */
  badgeClass: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfigEntry> = {
  AI: {
    color: 'var(--color-neon-ai)',
    label: 'AI',
    cardClass: 'ai-card',
    badgeClass: 'badge-ai',
  },
  SCIENCE: {
    color: 'var(--color-neon-science)',
    label: 'SCIENCE',
    cardClass: 'science-card',
    badgeClass: 'badge-science',
  },
  ROBOTICS: {
    color: 'var(--color-neon-robotics)',
    label: 'ROBOTICS',
    cardClass: 'robotics-card',
    badgeClass: 'badge-robotics',
  },
  GADGETS: {
    color: 'var(--color-neon-gadgets)',
    label: 'GADGETS',
    cardClass: 'gadgets-card',
    badgeClass: 'badge-gadgets',
  },
};
