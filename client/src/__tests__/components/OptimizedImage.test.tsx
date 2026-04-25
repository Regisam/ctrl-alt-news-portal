import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '@/components/OptimizedImage';

describe('OptimizedImage Component', () => {
  const defaultProps = {
    srcWebp: '/images/optimized/test.webp',
    srcJpg: '/images/optimized/test.jpg',
    alt: 'Test image'
  };

  it('renders picture element with sources', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const picture = container.querySelector('picture');
    const source = container.querySelector('source[type="image/webp"]');

    expect(picture).toBeInTheDocument();
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute('srcset', '/images/optimized/test.webp');
  });

  it('renders img with JPEG fallback', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByAltText('Test image');

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/optimized/test.jpg');
  });

  it('applies lazy loading by default', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByAltText('Test image');

    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('disables lazy loading when lazy=false', () => {
    render(<OptimizedImage {...defaultProps} lazy={false} />);
    const img = screen.getByAltText('Test image');

    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('applies width and height attributes', () => {
    render(<OptimizedImage {...defaultProps} width={800} height={600} />);
    const img = screen.getByAltText('Test image');

    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('applies custom className', () => {
    render(<OptimizedImage {...defaultProps} className="rounded-lg shadow-md" />);
    const img = screen.getByAltText('Test image');

    expect(img).toHaveClass('rounded-lg', 'shadow-md');
  });

  it('forwards additional props to img element', () => {
    render(
      <OptimizedImage
        {...defaultProps}
        title="Image title"
        data-testid="custom-image"
      />
    );
    const img = screen.getByAltText('Test image');

    expect(img).toHaveAttribute('title', 'Image title');
    expect(img).toHaveAttribute('data-testid', 'custom-image');
  });

  it('handles string width/height values', () => {
    render(<OptimizedImage {...defaultProps} width="100%" height="auto" />);
    const img = screen.getByAltText('Test image');

    expect(img).toHaveAttribute('width', '100%');
    expect(img).toHaveAttribute('height', 'auto');
  });
});
