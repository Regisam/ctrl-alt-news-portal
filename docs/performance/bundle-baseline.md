# Bundle Baseline Metrics — Story 10.9

**Date:** 2026-04-25  
**Measured on:** Production build (npm run build)

## Current Bundle Size

| Metric | Size (Ungzipped) | Size (Gzipped) | Status |
|--------|------------------|----------------|--------|
| Main JS Bundle | 1,465.60 KB | 393.38 KB | ❌ ABOVE target |
| Main CSS Bundle | 124.08 KB | 20.05 KB | ✅ OK |
| HTML | 368.66 KB | 105.78 KB | ℹ️ SPA payload |

**Target:** Main JS < 150 KB (gzipped)  
**Current:** 393.38 KB (gzipped)  
**Gap:** -243.38 KB (61% reduction needed)

## Bundle Composition

### Main Bundle Contents
- **Framework:** React 19, ReactDOM
- **UI Libraries:** Radix UI (all components), Tailwind CSS
- **Routing:** Wouter
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Notifications:** Sonner
- **Icons:** Lucide React
- **Monitoring:** Web Vitals, OpenTelemetry (browser)
- **Themes:** next-themes
- **Utilities:** Axios, nanoid, uuid, Winston (logging)

### Large Dependencies Detected
1. **Recharts** (~150KB ungzipped) - Used only on admin/analytics pages
2. **Radix UI** (~100KB ungzipped) - All components bundled, not code-split
3. **OpenTelemetry browser packages** (~50KB) - Loaded on all routes
4. **React Hook Form + Resolvers** (~40KB) - Used only on form pages
5. **Zod** (~30KB) - Used only on validation pages

## Analysis Summary

**Problem:** Single monolithic bundle includes ALL dependencies regardless of route.

**Root Cause:** 
- No route-based code splitting configured in Vite
- All components compiled into single index-{hash}.js
- No dynamic imports for heavy components
- Vendor dependencies merged into app bundle

**Opportunities for Optimization:**
1. ✅ Split by route (pages get separate chunks)
2. ✅ Lazy load heavy components (Recharts, analytics)
3. ✅ Separate vendor chunk (React, Radix, etc.)
4. ✅ Tree-shake unused Radix components
5. ✅ Defer non-critical libraries (monitoring, logging)

## Performance Metrics (Current)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Time to Interactive (TTI) | ~2.8s (mobile) | <3s | ⚠️ Close |
| Largest Contentful Paint (LCP) | ~2.2s | <2.5s | ✅ OK |
| First Contentful Paint (FCP) | ~1.2s | — | ℹ️ Baseline |
| First Input Delay (FID) | ~45ms | <100ms | ✅ OK |
| Cumulative Layout Shift (CLS) | ~0.05 | <0.1 | ✅ OK |

**Core Web Vitals:** GREEN (from Story 10.8)

## Next Steps

**Task 1 (Current):** ✅ Baseline measured and documented

**Task 2:** Implement route-based code splitting
- Convert route components to `React.lazy()`
- Add `Suspense` boundaries
- Verify chunk output

**Task 3:** Optimize vendor bundle
- Separate vendor code from app code
- Identify unused dependencies
- Verify chunk separation

**Task 4:** Asset compression
- Verify gzip headers
- Consider brotli compression
- Validate in browser Network tab

**Task 5:** Final validation
- Re-measure TTI improvement
- Run Lighthouse audit
- Ensure no performance regression

---

## Build Configuration

**Build Tool:** Vite 7.1.7  
**JavaScript Engine:** esbuild (0.25.0)  
**TypeScript:** 5.6.3 (strict mode)  
**Bundle Format:** ES modules (client-side import)

**Current Vite Config Issues:**
- No manual chunks configuration
- No dynamic import optimization
- No tree-shaking configuration for unused Radix components
- OpenTelemetry includes unnecessary browser polyfills

---

*Documented by @dev on 2026-04-25*
