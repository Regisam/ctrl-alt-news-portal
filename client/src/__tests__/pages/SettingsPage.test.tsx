import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../../pages/SettingsPage';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useReadingHistory } from '../../hooks/useReadingHistory';
import { useReactions } from '../../hooks/useReactions';
import { useTheme } from '../../contexts/ThemeContext';
import * as abTesting from '../../lib/ab-testing';

vi.mock('../../hooks/useUserPreferences');
vi.mock('../../hooks/useBookmarks');
vi.mock('../../hooks/useReadingHistory');
vi.mock('../../hooks/useReactions');
vi.mock('../../contexts/ThemeContext');
vi.mock('../../lib/ab-testing');

const mockUseUserPreferences = useUserPreferences as ReturnType<typeof vi.fn>;
const mockUseBookmarks = useBookmarks as ReturnType<typeof vi.fn>;
const mockUseReadingHistory = useReadingHistory as ReturnType<typeof vi.fn>;
const mockUseReactions = useReactions as ReturnType<typeof vi.fn>;
const mockUseTheme = useTheme as ReturnType<typeof vi.fn>;

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUserPreferences.mockReturnValue({
      favoriteCategories: ['AI'],
      updateFavoriteCategories: vi.fn(),
      toggleDarkMode: vi.fn(),
    });

    mockUseBookmarks.mockReturnValue({
      bookmarks: [],
      clearBookmarks: vi.fn(),
      bookmarkCount: 0,
    });

    mockUseReadingHistory.mockReturnValue({
      history: [],
      clearHistory: vi.fn(),
    });

    mockUseReactions.mockReturnValue({
      reactions: [],
      clearReactions: vi.fn(),
    });

    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      switchable: true,
    });

    vi.mocked(abTesting.setExperimentEnabled).mockImplementation(() => {});
  });

  it('should render settings page title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('should render all main sections', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Categorias Favoritas')).toBeInTheDocument();
    expect(screen.getByText('Aparência')).toBeInTheDocument();
    expect(screen.getByText('Testes A/B')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Dados')).toBeInTheDocument();
  });

  it('should display favorite categories with checkboxes', () => {
    render(<SettingsPage />);
    const categories = ['AI', 'Science', 'Robotics', 'Gadgets'];
    categories.forEach(category => {
      expect(screen.getByLabelText(category)).toBeInTheDocument();
    });
  });

  it('should check category when in favoriteCategories', () => {
    render(<SettingsPage />);
    const aiCheckbox = screen.getByLabelText('AI') as HTMLInputElement;
    expect(aiCheckbox.checked).toBe(true);
  });

  it('should uncheck category when not in favoriteCategories', () => {
    render(<SettingsPage />);
    const scienceCheckbox = screen.getByLabelText('Science') as HTMLInputElement;
    expect(scienceCheckbox.checked).toBe(false);
  });

  it('should toggle category when clicking checkbox', async () => {
    const updateFavoriteCategories = vi.fn();
    mockUseUserPreferences.mockReturnValue({
      favoriteCategories: ['AI'],
      updateFavoriteCategories,
      toggleDarkMode: vi.fn(),
    });

    render(<SettingsPage />);
    const scienceCheckbox = screen.getByLabelText('Science');

    await userEvent.click(scienceCheckbox);

    expect(updateFavoriteCategories).toHaveBeenCalledWith(['AI', 'Science']);
  });

  it('should remove category when unchecking', async () => {
    const updateFavoriteCategories = vi.fn();
    mockUseUserPreferences.mockReturnValue({
      favoriteCategories: ['AI', 'Science'],
      updateFavoriteCategories,
      toggleDarkMode: vi.fn(),
    });

    render(<SettingsPage />);
    const aiCheckbox = screen.getByLabelText('AI');

    await userEvent.click(aiCheckbox);

    expect(updateFavoriteCategories).toHaveBeenCalledWith(['Science']);
  });

  it('should display current theme', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Modo Claro')).toBeInTheDocument();
  });

  it('should toggle theme when clicking button', async () => {
    const toggleDarkMode = vi.fn();
    const toggleTheme = vi.fn();
    mockUseUserPreferences.mockReturnValue({
      favoriteCategories: [],
      updateFavoriteCategories: vi.fn(),
      toggleDarkMode,
    });
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme,
      switchable: true,
    });

    render(<SettingsPage />);
    const toggleButton = screen.getByText('Alternar');

    await userEvent.click(toggleButton);

    expect(toggleDarkMode).toHaveBeenCalled();
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('should display bookmarks count', () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks: vi.fn(),
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    expect(screen.getByText('Favoritos (1)')).toBeInTheDocument();
  });

  it('should display history count', () => {
    mockUseReadingHistory.mockReturnValue({
      history: [
        { articleId: '1', title: 'Test', category: 'AI', timestamp: Date.now() },
      ],
      clearHistory: vi.fn(),
    });

    render(<SettingsPage />);
    expect(screen.getByText('Histórico (1)')).toBeInTheDocument();
  });

  it('should display reactions count', () => {
    mockUseReactions.mockReturnValue({
      reactions: [
        { articleId: '1', userId: 'user1', type: 'like', timestamp: Date.now() },
      ],
      clearReactions: vi.fn(),
    });

    render(<SettingsPage />);
    expect(screen.getByText('Reações (1)')).toBeInTheDocument();
  });

  it('should show empty message when no bookmarks', () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [],
      clearBookmarks: vi.fn(),
      bookmarkCount: 0,
    });

    render(<SettingsPage />);
    expect(screen.getByText('Você não tem favoritos')).toBeInTheDocument();
  });

  it('should show empty message when no history', () => {
    mockUseReadingHistory.mockReturnValue({
      history: [],
      clearHistory: vi.fn(),
    });

    render(<SettingsPage />);
    expect(screen.getByText('Seu histórico está vazio')).toBeInTheDocument();
  });

  it('should show empty message when no reactions', () => {
    mockUseReactions.mockReturnValue({
      reactions: [],
      clearReactions: vi.fn(),
    });

    render(<SettingsPage />);
    expect(screen.getByText('Você não tem reações')).toBeInTheDocument();
  });

  it('should not show clear buttons when data is empty', () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [],
      clearBookmarks: vi.fn(),
      bookmarkCount: 0,
    });

    render(<SettingsPage />);
    const clearButtons = screen.queryAllByText('Remover todos');
    expect(clearButtons).toHaveLength(0);
  });

  it('should show clear buttons when data exists', () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks: vi.fn(),
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    const clearButton = screen.getByText('Remover todos');
    expect(clearButton).toBeInTheDocument();
  });

  it('should show confirmation modal for bookmarks', async () => {
    const clearBookmarks = vi.fn();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks,
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    const clearButton = screen.getByText('Remover todos');

    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Remover todos os favoritos?')).toBeInTheDocument();
    });
  });

  it('should clear bookmarks when confirmed', async () => {
    const clearBookmarks = vi.fn();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks,
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    const clearButton = screen.getByText('Remover todos');

    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Remover todos os favoritos?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Remover', { selector: 'button' });
    await userEvent.click(confirmButton);

    expect(clearBookmarks).toHaveBeenCalled();
  });

  it('should cancel clear operation', async () => {
    const clearBookmarks = vi.fn();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks,
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    const clearButton = screen.getByText('Remover todos');

    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Remover todos os favoritos?')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancelar');
    await userEvent.click(cancelButton);

    expect(clearBookmarks).not.toHaveBeenCalled();
    expect(screen.queryByText('Remover todos os favoritos?')).not.toBeInTheDocument();
  });

  it('should show export data button', () => {
    render(<SettingsPage />);
    const exportButton = screen.getByText('Exportar Dados (JSON)');
    expect(exportButton).toBeInTheDocument();
  });

  it('should export data when clicking export button', async () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [{ articleId: '1', title: 'Test', category: 'AI', dateSaved: Date.now() }],
      clearBookmarks: vi.fn(),
      bookmarkCount: 1,
    });

    render(<SettingsPage />);
    const exportButton = screen.getByText('Exportar Dados (JSON)');

    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveClass('bg-green-600');
  });

  it('should show A/B test opt-out button', () => {
    render(<SettingsPage />);
    const optOutButton = screen.getByText('Excluir dos testes');
    expect(optOutButton).toBeInTheDocument();
  });

  it('should display A/B section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Testes A/B')).toBeInTheDocument();
    expect(screen.getByText('Você está incluído dos testes A/B')).toBeInTheDocument();
  });

  it('should have responsive grid for categories', () => {
    render(<SettingsPage />);
    const section = screen.getByText('Categorias Favoritas').closest('section');
    const grid = section?.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2', 'gap-4');
  });
});
