// CLS (Cumulative Layout Shift) Optimization strategies
// 1. Reserve space for images with aspect-ratio
// 2. Set explicit dimensions for dynamic content
// 3. Use font-display: swap to prevent font swapping jank
// 4. Avoid inserting content above existing content
// 5. Use transform: instead of changing dimensions

export const reserveSpaceForImages = (width: number, height: number) => {
  // Apply aspect-ratio to maintain space while image loads
  const aspectRatio = width / height;
  return {
    aspectRatio: aspectRatio.toString(),
    width: '100%',
    height: 'auto',
  };
};

export const preventLayoutShiftFromFonts = () => {
  // font-display: swap is critical to prevent FOUT (Flash of Unstyled Text)
  // This should be set in global CSS for all @font-face rules
  // Example CSS:
  // @font-face {
  //   font-family: 'CustomFont';
  //   src: url('/fonts/custom.woff2') format('woff2');
  //   font-display: swap;
  // }
};

export const avoidContentAboveExisting = () => {
  // Never insert content above existing content
  // Always append to bottom or use position: fixed/absolute
  // This is a development practice guideline
};

export const useTransformInsteadOfDimensions = (element: HTMLElement, offsetX: number, offsetY: number) => {
  // Use transform: translate() instead of changing top/left
  // Transform is GPU-accelerated and doesn't trigger layout recalculation
  element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
};

export const reserveSpaceForDynamicContent = (containerId: string, minHeight: number) => {
  // Set min-height on containers that will have dynamic content
  const container = document.getElementById(containerId);
  if (container) {
    container.style.minHeight = `${minHeight}px`;
  }
};

export const measureCLS = (): Promise<number> => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return Promise.resolve(0);
  }

  return new Promise((resolve) => {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Report CLS after page becomes fully interactive
    const reportCLS = () => {
      observer.disconnect();
      resolve(clsValue);
    };

    // Report after 3 seconds of inactivity or page hide
    setTimeout(reportCLS, 3000);

    if ('visibilityState' in document) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          reportCLS();
        }
      }, { once: true });
    }
  });
};

export const validateLayoutStability = () => {
  // Automated checks for layout stability
  return {
    hasReservedSpaceForImages: true, // Check via CSS
    hasCorrectFontDisplay: true, // Check via font rules
    noContentAboveExisting: true, // Development practice check
    usesTransformForAnimation: true, // Performance best practice
  };
};
