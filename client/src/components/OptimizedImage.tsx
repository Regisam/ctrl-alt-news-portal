import React, { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  webpSrc?: string;
}

/**
 * Optimized image component with lazy loading and WebP support
 * - Uses loading="lazy" by default for better LCP
 * - Supports WebP with JPEG fallback for better compression
 * - Accepts width/height to prevent layout shift (improves CLS)
 */
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, webpSrc, width, height, loading = 'lazy', decoding = 'async', ...props }, ref) => {
    // If WebP source provided, use <picture> element
    if (webpSrc) {
      return (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <source srcSet={src} type="image/jpeg" />
          <img
            ref={ref}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            decoding={decoding}
            {...props}
          />
        </picture>
      );
    }

    // Standard img tag with lazy loading and async decoding
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
