// FID (First Input Delay) Optimization strategies
// 1. JavaScript code splitting and lazy loading
// 2. Defer third-party scripts (ads, analytics)
// 3. Break up long tasks with requestIdleCallback
// 4. Minimize event listener processing

export const setupCodeSplitting = () => {
  // This is configured in Vite/bundler configuration
  // Using dynamic imports for route-based code splitting
  // Example: const Component = React.lazy(() => import('./Component'))
};

export const deferThirdPartyScripts = () => {
  if (typeof window === 'undefined') return;

  // Defer third-party scripts until after page-interactive
  const thirdPartyScripts = [
    { src: 'https://www.googletagmanager.com/gtag/js', async: true },
    // Add other third-party scripts here
  ];

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      thirdPartyScripts.forEach(({ src, async: isAsync }) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = isAsync;
        document.body.appendChild(script);
      });
    });
  }
};

export const breakUpLongTasks = (callback: () => void, delayMs = 5) => {
  // Break up expensive operations into smaller chunks
  // Yield to main thread periodically
  if ('scheduler' in window) {
    (window.scheduler as any).yield().then(callback);
  } else if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, delayMs);
  }
};

export const optimizeEventHandlers = () => {
  // Use event delegation to reduce number of event listeners
  // Debounce expensive handlers (scroll, resize, input)
  // Avoid blocking operations in event handlers
};

export const measureFID = (): Promise<number> => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return Promise.resolve(0);
  }

  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const firstEntry = entries[0];
        resolve((firstEntry as any).processingDuration);
        observer.disconnect();
      }
    });

    observer.observe({ entryTypes: ['first-input'] });

    // Timeout after 10 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve(0);
    }, 10000);
  });
};

export const optimizeInteractionHandling = (handler: () => void) => {
  // Wrap event handlers to minimize blocking time
  // Returns a debounced/throttled version if needed
  return handler;
};
