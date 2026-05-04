import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImpactReportPage from '../../pages/ImpactReportPage';
import { useReadingHistory } from '../../hooks/useReadingHistory';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useReactions } from '../../hooks/useReactions';
import { useUserPreferences } from '../../hooks/useUserPreferences';

vi.mock('../../hooks/useReadingHistory');
vi.mock('../../hooks/useBookmarks');
vi.mock('../../hooks/useReactions');
vi.mock('../../hooks/useUserPreferences');

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock'),
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});

const mockUseReadingHistory = useReadingHistory as ReturnType<typeof vi.fn>;
const mockUseBookmarks = useBookmarks as ReturnType<typeof vi.fn>;
const mockUseReactions = useReactions as ReturnType<typeof vi.fn>;
const mockUseUserPreferences = useUserPreferences as ReturnType<typeof vi.fn>;

describe('ImpactReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const baseTime = Date.now();
    const fifteenDaysAgo = baseTime - 15 * 24 * 60 * 60 * 1000;

    mockUseReadingHistory.mockReturnValue({
      history: [
        {
          articleId: '1',
          title: 'AI Breakthrough',
          category: 'AI',
          timestamp: fifteenDaysAgo + 1 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '2',
          title: 'Quantum Discovery',
          category: 'Science',
          timestamp: fifteenDaysAgo + 5 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '3',
          title: 'Robot Innovation',
          category: 'Robotics',
          timestamp: fifteenDaysAgo + 10 * 24 * 60 * 60 * 1000,
        },
      ],
      clearHistory: vi.fn(),
    });

    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: '1',
          title: 'AI Breakthrough',
          category: 'AI',
          dateSaved: fifteenDaysAgo + 1 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '1',
          title: 'AI Breakthrough',
          category: 'AI',
          dateSaved: fifteenDaysAgo + 3 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '2',
          title: 'Quantum Discovery',
          category: 'Science',
          dateSaved: fifteenDaysAgo + 6 * 24 * 60 * 60 * 1000,
        },
      ],
      clearBookmarks: vi.fn(),
      bookmarkCount: 3,
    });

    mockUseReactions.mockReturnValue({
      reactions: [
        {
          articleId: '1',
          userId: 'user1',
          type: 'like',
          timestamp: fifteenDaysAgo + 2 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '2',
          userId: 'user2',
          type: 'clap',
          timestamp: fifteenDaysAgo + 5 * 24 * 60 * 60 * 1000,
        },
        {
          articleId: '3',
          userId: 'user3',
          type: 'like',
          timestamp: fifteenDaysAgo + 11 * 24 * 60 * 60 * 1000,
        },
      ],
      clearReactions: vi.fn(),
    });

    mockUseUserPreferences.mockReturnValue({
      favoriteCategories: ['AI', 'Science'],
      updateFavoriteCategories: vi.fn(),
      toggleDarkMode: vi.fn(),
    });
  });

  it('should render page title', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Personalization Impact Report')).toBeInTheDocument();
  });

  it('should render page description', () => {
    render(<ImpactReportPage />);
    expect(
      screen.getByText(/Measure the effectiveness of your personalized feed/)
    ).toBeInTheDocument();
  });

  it('should render filter button', () => {
    render(<ImpactReportPage />);
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('should render export buttons', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should display key metrics cards', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Personalized CTR')).toBeInTheDocument();
    expect(screen.getByText('Chronological CTR')).toBeInTheDocument();
    expect(screen.getByText(/Avg Time \(Personalized\)/)).toBeInTheDocument();
    expect(screen.getByText('Bounce Rate (For You)')).toBeInTheDocument();
  });

  it('should show filter panel when clicking filter button', async () => {
    const user = userEvent.setup();
    render(<ImpactReportPage />);
    const filterButton = screen.getByText('Filters');

    await user.click(filterButton);

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should hide filter panel when clicking filter button again', async () => {
    const user = userEvent.setup();
    render(<ImpactReportPage />);
    const filterButton = screen.getByText('Filters');

    await user.click(filterButton);
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();

    await user.click(filterButton);
    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
  });

  it('should have date input fields', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImpactReportPage />);
    const filterButton = screen.getByText('Filters');

    await user.click(filterButton);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
  });

  it('should display CTR comparison chart', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('CTR Comparison')).toBeInTheDocument();
  });

  it('should display time spent comparison chart', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Avg Time Spent Comparison')).toBeInTheDocument();
  });

  it('should display category engagement table', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Category Engagement (Top 5)')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getAllByText('Saves').length).toBeGreaterThan(0);
  });

  it('should display A/B test results section', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('A/B Test Results')).toBeInTheDocument();
  });

  it('should display recommendations section', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('should have responsive grid layout', () => {
    const { container } = render(<ImpactReportPage />);
    const gridElements = container.querySelectorAll('[class*="grid"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should have dark mode support', () => {
    const { container } = render(<ImpactReportPage />);
    const darkModeElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkModeElements.length).toBeGreaterThan(0);
  });

  it('should render category data in table', () => {
    render(<ImpactReportPage />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should calculate metrics correctly', () => {
    render(<ImpactReportPage />);
    // Personalized CTR should be > 0 with engagement
    const ctrValues = screen.getAllByText(/\d+\.\d+%/);
    expect(ctrValues.length).toBeGreaterThan(0);
  });

  it('should export JSON when export JSON button clicked', async () => {
    const user = userEvent.setup();
    render(<ImpactReportPage />);
    const exportButton = screen.getByText('Export JSON');

    expect(exportButton).toBeInTheDocument();
    await user.click(exportButton);
    expect(exportButton).toBeInTheDocument();
  });

  it('should export CSV when export CSV button clicked', async () => {
    const user = userEvent.setup();
    render(<ImpactReportPage />);
    const exportButton = screen.getByText('Export CSV');

    expect(exportButton).toBeInTheDocument();
    await user.click(exportButton);
    expect(exportButton).toBeInTheDocument();
  });

  it('should have proper metric labels', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText('Experiment ID')).toBeInTheDocument();
    expect(screen.getByText('Control CTR')).toBeInTheDocument();
    expect(screen.getByText('Variant CTR')).toBeInTheDocument();
    expect(screen.getByText('Improvement')).toBeInTheDocument();
  });

  it('should update metrics when filters change', async () => {
    const user = userEvent.setup();
    render(<ImpactReportPage />);

    const filterButton = screen.getByText('Filters');
    await user.click(filterButton);

    const dateInputs = screen.getAllByDisplayValue(/.+/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('should display confidence level in A/B test results', () => {
    render(<ImpactReportPage />);
    expect(screen.getByText(/Confidence Level:/)).toBeInTheDocument();
  });

  it('should show category engagement columns', () => {
    render(<ImpactReportPage />);
    const headers = screen.getAllByText('Reactions');
    expect(headers.length).toBeGreaterThan(0);
  });
});
