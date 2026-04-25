import { useEffect, useRef, useState } from 'react';

interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

export const useImageLazyLoading = (options: IntersectionOptions = {}) => {
  const elementRef = useRef<HTMLImageElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  // Native lazy loading is supported, no need for custom hook
  const isLoaded = 'loading' in HTMLImageElement.prototype;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isLoaded) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin ?? '50px',
      root: options.root ?? null
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [isLoaded, options.threshold, options.rootMargin, options.root]);

  return { elementRef, isInView, isLoaded };
};
