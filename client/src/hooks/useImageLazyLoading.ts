import { useEffect, useRef, useState } from 'react';

interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

export const useImageLazyLoading = (options: IntersectionOptions = {}) => {
  const elementRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use native lazy loading as fallback for browsers without IntersectionObserver
    if ('loading' in HTMLImageElement.prototype) {
      setIsLoaded(true);
      return;
    }

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
  }, [options.threshold, options.rootMargin, options.root]);

  return { elementRef, isInView, isLoaded };
};
