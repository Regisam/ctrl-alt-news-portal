# EPIC 6: UX/UI Compliance & Accessibility

**Epic ID**: EPIC-6  
**Status**: Draft  
**Sprints**: 3-6 (parallel, 50 hours)  
**Priority**: P1 (High)  
**Product Manager**: Morgan  
**UX Lead**: Uma (Design Expert)  
**Date Created**: 2026-04-16

---

## Epic Summary

Address UX/UI gaps and accessibility issues identified by Uma's analysis. Focus on WCAG AA compliance, mobile responsiveness, design system consolidation, and internationalization foundation.

**Rationale**: Platform must be accessible and usable by diverse audience. Fixes blockers preventing professional launch (UX/UI Analysis report, 20 issues identified).

**Success Criteria**:
- [ ] WCAG AA compliance: 100% of automated checks passing
- [ ] Mobile responsiveness: all pages work on 320px-2560px widths
- [ ] Design tokens extracted to shared system
- [ ] i18n framework configured for multi-language support
- [ ] No hardcoded colors or spacing
- [ ] Keyboard navigation fully functional
- [ ] Screen reader tested and working
- [ ] Axe accessibility report: 0 critical/serious issues

---

## Story 6.1: WCAG AA Compliance & Accessibility Fixes

**Status**: Ready  
**Sprint**: 3-4  
**Effort**: L (32 hours)  
**Owner**: @ux-design-expert (Uma)

### Description

Audit and fix accessibility issues to meet WCAG AA standards. Includes color contrast fixes, ARIA labels, focus management, and keyboard navigation.

**Reference**: UX/UI Analysis section 2.1 (Accessibility findings), PRD section 1.3 (Accessibility priority)

### Acceptance Criteria

- [ ] Color contrast ratio >= 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- [ ] All interactive elements have visible focus indicators
- [ ] All images have alt text
- [ ] All form inputs have associated labels
- [ ] ARIA labels on buttons without text (icon buttons)
- [ ] ARIA roles on custom components (carousel, combobox)
- [ ] Semantic HTML: proper heading hierarchy (h1 → h2 → h3)
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Skip navigation link on all pages
- [ ] Axe DevTools audit: 0 critical/serious violations

### Tasks

1. Run Axe accessibility audit on all pages
2. Fix color contrast issues (neon colors may need adjustment)
3. Add alt text to all images
4. Add aria-labels to icon buttons
5. Add form input labels (`<label for="">`)
6. Fix heading hierarchy (h1 per page, proper nesting)
7. Add skip navigation link
8. Implement focus visible styles (outline or underline)
9. Test keyboard navigation with Tab/Shift+Tab
10. Test with screen reader (NVDA, JAWS, or VoiceOver)

### Dependencies

- **Blocked by**: None (can run in parallel)
- **Blocks**: None (independent)

### Notes

- Color contrast: use [Contrast Ratio](https://contrast-ratio.com/) tool
- ARIA roles: use Radix UI's built-in support
- Focus styles: use CSS `:focus-visible` (not `:focus`)
- Skip link: must be first keyboard-focusable element
- Test with real screen readers (not just automated tools)
- Reference: [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Story 6.2: Mobile Responsiveness & Touch UX

**Status**: Ready  
**Sprint**: 4-5  
**Effort**: L (32 hours)  
**Owner**: @ux-design-expert (Uma)

### Description

Ensure responsive design across all breakpoints (320px-2560px). Fix mobile-specific issues: sidebars, touch targets, horizontal scrolling, and layout shifts.

**Reference**: UX/UI Analysis section 2.2 (Responsiveness findings)

### Acceptance Criteria

- [ ] All pages tested on: 320px (mobile), 768px (tablet), 1920px (desktop), 2560px (ultrawide)
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets >= 48x48px (mobile friendly)
- [ ] Sidebar converts to hamburger menu on mobile
- [ ] Text readable without zooming (font size >= 16px on mobile)
- [ ] Images scale responsively (no overflow)
- [ ] Forms stack vertically on mobile
- [ ] Carousel works with touch (swipe)
- [ ] Modal/overlay touchable area expanded (no accidental closes)
- [ ] No layout shift (Cumulative Layout Shift < 0.1)

### Tasks

1. Test all pages on mobile breakpoints (Chrome DevTools)
2. Fix sidebar overflow (convert to drawer/modal on mobile)
3. Fix carousel touch detection (swipe gestures)
4. Adjust touch target sizes (buttons, links)
5. Fix form layout on mobile (stack vertically)
6. Test image scaling (no overflow)
7. Fix modal close areas (prevent accidental dismiss)
8. Test on real devices (iPhone, Android)
9. Measure Cumulative Layout Shift (Lighthouse)
10. Document responsive breakpoints in design system

### Dependencies

- **Blocked by**: None (can run in parallel)
- **Blocks**: None (independent)

### Notes

- Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch targets: min 48x48px (WCAG AAA)
- Sidebars: use Radix Dialog for mobile drawer
- Carousel: use Embla for touch support (already integrated)
- Test on actual devices (not just DevTools)
- Lighthouse mobile score: >= 90

---

## Story 6.3: Design Tokens & Consolidation

**Status**: Ready  
**Sprint**: 5  
**Effort**: M (16 hours)  
**Owner**: @ux-design-expert (Uma)

### Description

Extract design system into centralized tokens: colors, spacing, typography, shadows. Eliminate hardcoded values and ensure consistency across components.

**Reference**: UX/UI Analysis section 1.3 (Design redundancies)

### Acceptance Criteria

- [ ] Design tokens file created (`lib/designTokens.ts` or `tokens.json`)
- [ ] Color palette centralized (no color() in components)
- [ ] Spacing scale defined (4px, 8px, 16px, 24px, 32px, etc.)
- [ ] Typography scale: font sizes, weights, line heights
- [ ] Shadow definitions (subtle, medium, prominent)
- [ ] Border radius standardized (sm, md, lg, full)
- [ ] Category colors in single source (`CATEGORY_COLORS`)
- [ ] All components updated to use tokens (no inline styles)
- [ ] Tailwind config references design tokens
- [ ] Storybook components show tokens visually

### Tasks

1. Create design tokens file (`lib/designTokens.ts`)
2. Extract colors: primary, secondary, neon, status colors
3. Define spacing scale (use Tailwind scale as baseline)
4. Define typography scale (font families, sizes, weights)
5. Define shadows (3-4 standard shadows)
6. Define border radius values
7. Update Tailwind config to use tokens
8. Replace all hardcoded colors in components
9. Replace all inline spacing with token values
10. Create Storybook tokens showcase page

### Dependencies

- **Blocked by**: None (can run in parallel)
- **Blocks**: None (independent)

### Notes

- Use CSS variables or TypeScript constants (avoid Tailwind complexity)
- Consider Figma integration for token sync (Phase 2)
- Storybook can display tokens visually
- Token naming: `{category}-{property}-{state}` (e.g., `color-neon-ai`, `spacing-lg`)
- Include dark mode variants in tokens

---

## Story 6.4: i18n Framework Setup & Internationalization

**Status**: Ready  
**Sprint**: 6  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Setup internationalization framework supporting English and Portuguese (Brazil). Extract hardcoded text into translation files for future language support.

**Reference**: PRD section 1.2 (Current state - bilingual UI), UX/UI Analysis section 3.1

### Acceptance Criteria

- [ ] i18n library integrated (next-i18next or i18next)
- [ ] English (en) and Portuguese (pt-BR) translation files created
- [ ] All UI text extracted from components into translation files
- [ ] Language switcher in header changes locale
- [ ] Locale persisted in localStorage
- [ ] Date/time formatting respects locale
- [ ] Form validation messages localized
- [ ] Email templates translated
- [ ] API error messages translated
- [ ] Performance: no layout shift when loading translations

### Tasks

1. Install i18n library (`i18next`, `react-i18next`)
2. Create translation files: `public/locales/en/common.json`, `pt-BR/common.json`
3. Extract text from components (build JSON structure)
4. Setup i18n config in app (`i18n.ts`)
5. Wrap app with i18n provider
6. Create language switcher component
7. Implement date/time localization (`Intl.DateTimeFormat`)
8. Translate form validation messages
9. Translate API error messages
10. Test language switching on all pages

### Dependencies

- **Blocked by**: None (can run in parallel)
- **Blocks**: None (independent)

### Notes

- Use namespaced translation files (common, articles, auth, etc.)
- Language switcher: persist in localStorage
- Date formatting: use `Intl.DateTimeFormat` (browser-native)
- Pluralization: use i18next features
- Consider RTL languages later (Phase 2, Arabic, Hebrew)
- Translation keys: kebab-case (common.email-sent)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| WCAG AA compliance | 100% automated tests | To verify |
| Mobile responsiveness | All breakpoints tested | To verify |
| Design token coverage | 100% of values | To verify |
| i18n completeness | EN + PT-BR | To verify |

---

## Epic Dependencies & Timeline

```
All stories can run in parallel (3-6):
├── Story 6.1 (Accessibility) ────┐
├── Story 6.2 (Mobile) ───────────┤
├── Story 6.3 (Design Tokens) ────┼──> Sprint 5-6 completion
└── Story 6.4 (i18n) ─────────────┘
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Color contrast conflicts with design | Aesthetic compromise | Use Figma contrast checker early |
| i18n adds bundle size | Performance concern | Use dynamic imports for language files |
| Mobile testing time | Schedule blocker | Use real devices + DevTools testing |

---

## Appendix: Files to Create/Modify

**New Files**:
- `lib/designTokens.ts`
- `public/locales/en/common.json`
- `public/locales/pt-BR/common.json`
- `i18n.ts`
- `components/LanguageSwitcher.tsx`

**Modified Files**:
- `client/src/App.tsx` (i18n provider)
- `client/src/components/*.tsx` (use tokens, translations)
- `tailwind.config.ts` (token references)
- `package.json` (dependencies)

**New Dependencies**:
```json
{
  "i18next": "^23.x",
  "react-i18next": "^14.x",
  "i18next-browser-languagedetector": "^8.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Uma (UX Design Expert)
