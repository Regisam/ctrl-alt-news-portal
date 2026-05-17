import { render, screen, userEvent } from '../test-utils';
import SearchBar from '@/components/SearchBar';

describe('SearchBar', () => {
  describe('Rendering', () => {
    it('should render search button when closed', () => {
      render(<SearchBar lang="en" />);
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeInTheDocument();
    });

    it('should render input field when opened', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should render close button when opened', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const closeBtn = screen.getByRole('button', { name: /close/i });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should open search when button clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should close search when close button clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);

      const input = screen.queryByRole('searchbox');
      expect(input).not.toBeInTheDocument();
    });

    it('should update input value on type', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      await user.type(input, 'React');

      expect(input.value).toContain('React');
    });

    it('should clear input on close', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button', { name: /search/i });
      await user.click(openBtn);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      await user.type(input, 'test');

      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should render Portuguese placeholder when lang="pt"', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="pt" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('placeholder', expect.stringContaining('Buscar'));
    });

    it('should render English placeholder when lang="en"', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('placeholder', expect.stringContaining('Search'));
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have search form available for keyboard input', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const form = screen.getByRole('search');
      expect(form).toBeInTheDocument();

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label');
    });

    it('should have search form role', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const form = screen.getByRole('search');
      expect(form).toBeInTheDocument();
    });

    it('should have autoComplete off on input', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      const openBtn = screen.getByRole('button');
      await user.click(openBtn);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });
  });

  describe('Component Structure', () => {
    it('should initially show only button', () => {
      render(<SearchBar lang="en" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('should toggle between button and form', async () => {
      const user = userEvent.setup();
      render(<SearchBar lang="en" />);

      // Initially button shown
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Click to open
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('searchbox')).toBeInTheDocument();

      // Close
      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
  });
});
