import React, { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  srcWebp: string;
  srcJpg: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  srcWebp,
  srcJpg,
  alt,
  lazy = true,
  width,
  height,
  className,
  ...props
}) => {
  const loading = lazy ? 'lazy' : 'eager';

  return (
    <picture>
      <source
        srcSet={srcWebp}
        type="image/webp"
      />
      <img
        src={srcJpg}
        alt={alt}
        loading={loading}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    </picture>
  );
};

OptimizedImage.displayName = 'OptimizedImage';
