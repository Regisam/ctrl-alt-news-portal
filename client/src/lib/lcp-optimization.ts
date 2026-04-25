// LCP Optimization strategies
// 1. Font Loading: font-display: swap in global CSS
// 2. Resource Preloading: critical resources preloaded in HTML head
// 3. Defer non-critical CSS/JS: async loading with media queries
// 4. Optimize server response time: already handled by Express

export const injectLCPOptimizations = () => {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link);

  // Preload DNS for critical third-party domains
  const criticalDomains = [
    'https://cdn.example.com',
    'https://api.example.com',
  ];

  criticalDomains.forEach((domain) => {
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = domain;
    document.head.appendChild(dnsLink);
  });
};

export const deferNonCriticalJS = () => {
  // Script loading strategy:
  // 1. Critical: inline or defer
  // 2. Non-critical: async or load after page-interactive
  // 3. Third-party: defer or load on user interaction

  if (typeof window === 'undefined') return;

  // Defer non-critical JS until page-interactive
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Load non-critical scripts here
      const script = document.createElement('script');
      script.src = '/js/non-critical.js';
      script.async = true;
      document.body.appendChild(script);
    });
  }
};

export const optimizeImageLoading = () => {
  // Already implemented in Story 10.7 with native lazy loading
  // Ensure all hero/featured images have loading="lazy"
  // Use OptimizedImage component with WebP + JPEG fallback
};

export const measureLCP = () => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  return new Promise<number>((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      resolve(lastEntry.renderTime || lastEntry.loadTime || 0);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Stop observing after 5 seconds (standard Web Vitals timing)
    setTimeout(() => {
      observer.disconnect();
      resolve(0);
    }, 5000);
  });
};
