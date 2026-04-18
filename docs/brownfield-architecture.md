# Ctrl Alt News Portal — Brownfield Architecture Document

## Introduction

This document captures the **current state** of the Ctrl Alt News Portal codebase, a full-stack cyberpunk-brutalism news portal with React frontend and Express.js backend. It includes actual patterns, architecture decisions, technical debt, and real-world constraints that developers must understand when working on enhancements.

### Document Scope

**Comprehensive documentation of the entire system** covering frontend architecture, backend server, build pipeline, styling patterns, and deployment configuration.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1.0 | Initial brownfield analysis | Aria (Architect) |

---

## Quick Reference — Key Files and Entry Points

### Critical Files for Understanding the System

| File | Purpose |
|------|---------|
| `client/src/App.tsx` | Main router component, all routes defined here |
| `server/index.ts` | Express.js server, SPA fallback handler |
| `vite.config.ts` | Vite configuration with plugins (Tailwind, Manus debug) |
| `package.json` | Dependencies, build scripts, pnpm config |
| `tsconfig.json` | TypeScript config with path aliases (@/, @shared/) |
| `client/src/const.ts` | Runtime OAuth URLs and utilities |
| `client/src/lib/data.ts` | Mock article data (Article type definition) |
| `client/src/contexts/ThemeContext.tsx` | Dark/light theme provider |
| `client/src/index.css` | Global styles (Tailwind + custom CSS) |

### Core Directories

| Directory | Purpose |
|-----------|---------|
| `client/src/pages/` | Route components (Home, ArticleDetail, Category, Search, etc.) |
| `client/src/components/` | Reusable UI components (Header, Footer, Carousels, Sections) |
| `client/src/components/ui/` | Radix UI primitive wrappers styled with Tailwind |
| `client/src/lib/` | Data files (mock articles, constants, utilities) |
| `client/src/contexts/` | React contexts (ThemeContext) |
| `shared/` | Shared types and constants (imported by client and server) |
| `server/` | Express.js backend (minimal, SPA-focused) |
| `dist/` | Build output: `dist/public/` (React bundle), `dist/index.js` (Node server) |
| `.aios-core/` | AIOS framework files (DO NOT MODIFY directly) |

---

## High Level Architecture

### Architectural Summary

**Ctrl Alt News Portal** is a **Single Page Application (SPA)** built with React 19 and served by Express.js. The architecture follows a **bundled monorepo pattern**:

- **Frontend**: React 19 (Vite) + TypeScript + Tailwind CSS v4 + Radix UI
- **Backend**: Express.js (minimal — only serves SPA + handles client routing)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Routing**: Client-side routing via Wouter
- **UI Components**: Radix UI primitives wrapped with Tailwind styling
- **Forms**: React Hook Form + Zod validation
- **Theme**: Custom React Context for dark/light mode
- **Data**: Mock data in `client/src/lib/data.ts` (no backend API)
- **Build**: Vite (React) + esbuild (Node server)
- **Deployment**: Node.js binary serving static SPA

### Technology Stack (from package.json)

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| **Runtime** | Node.js | 18+ (inferred) | ES modules only |
| **Frontend Framework** | React | 19.2.1 | Latest, in strict mode |
| **Language** | TypeScript | 5.6.3 | Strict mode, no emit (tsc --noEmit) |
| **Build Tool** | Vite | 7.1.7 | For React + dev server |
| **Build (Server)** | esbuild | 0.25.0 | Bundles server/index.ts → dist/index.js |
| **Styling** | Tailwind CSS | 4.1.14 | Via @tailwindcss/vite plugin |
| **UI Primitives** | Radix UI | v1-v2 | 40+ components used |
| **Routing** | Wouter | 3.3.5 | Lightweight client-side router (patched via pnpm) |
| **Forms** | React Hook Form | 7.64.0 | With @hookform/resolvers |
| **Validation** | Zod | 4.1.12 | TypeScript-first schema validation |
| **Carousel** | Embla Carousel React | 8.6.0 | For category carousels |
| **Charts** | Recharts | 2.15.2 | Data visualization (unused in current pages) |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Icons** | Lucide React | 0.453.0 | SVG icon library |
| **CSS Utilities** | clsx, tailwind-merge | Latest | For conditional class names |
| **Theme** | next-themes | 0.4.6 | Theme provider setup (custom in ThemeContext) |
| **Package Manager** | pnpm | 10.4.1+ | Workspace-friendly, with patched dependencies |

### Repository Structure Reality Check

- **Type**: Monorepo (single root, client + server + shared)
- **Package Manager**: pnpm (with patches for Wouter)
- **Build Output**: 
  - Client: `dist/public/` (Vite bundle)
  - Server: `dist/index.js` (esbuild bundle)
- **Dev Server**: Vite on port 3000 (via `npm run dev`)
- **Prod Server**: Node.js process running dist/index.js

---

## Source Tree and Module Organization

### Project Structure (Actual)

```
ctrl-alt-news-portal/
├── client/
│   └── src/
│       ├── pages/              # Route components
│       │   ├── Home.tsx         # Main landing page (hero + carousels)
│       │   ├── ArticleDetail.tsx # Single article view + comments + ads
│       │   ├── CategoryPage.tsx  # Category-specific listings (AI, Science, Robotics, Gadgets)
│       │   ├── SearchPage.tsx    # Search results (TODO: implement backend)
│       │   ├── AboutPage.tsx     # About section
│       │   ├── ContactPage.tsx   # Contact form (TODO: backend integration)
│       │   ├── PrivacyPage.tsx   # Privacy policy
│       │   ├── TermsPage.tsx     # Terms of service
│       │   └── NotFound.tsx      # 404 fallback
│       │
│       ├── components/          # Reusable components
│       │   ├── Header.tsx        # Top navigation + language selector
│       │   ├── Footer.tsx        # Footer with links
│       │   ├── HeroSection.tsx   # Hero banner + main featured article
│       │   ├── ArticleCarousel.tsx # Carousel for categories (AI, Science, Robotics, Gadgets)
│       │   ├── LatestInCategory.tsx # Latest 6 articles per category
│       │   ├── TrendingSection.tsx  # Trending articles slider
│       │   ├── GadgetsSection.tsx   # Gadgets product carousel
│       │   ├── ArticlesSection.tsx  # Grid of articles for category page
│       │   ├── CommentsSection.tsx  # Comments section on article detail
│       │   ├── SearchBar.tsx     # Search input component
│       │   ├── Sidebar.tsx       # Right sidebar (trending articles)
│       │   ├── Map.tsx           # Contact page map integration
│       │   ├── ErrorBoundary.tsx # Error fallback component
│       │   ├── ManusDialog.tsx   # Custom dialog (Manus-specific?)
│       │   └── ui/              # Radix UI wrapper components
│       │       ├── button.tsx, card.tsx, input.tsx, etc.
│       │
│       ├── contexts/
│       │   └── ThemeContext.tsx # Dark/light theme provider
│       │
│       ├── hooks/               # Custom React hooks (if any)
│       │
│       ├── lib/                 # Utilities and data
│       │   ├── data.ts           # Mock article data
│       │   ├── articleContent.ts # Article body content (markdown-like)
│       │   ├── constants.ts      # App constants
│       │   └── utils.ts          # Helper functions
│       │
│       ├── App.tsx             # Main router
│       ├── main.tsx            # React entry point
│       └── index.css           # Global styles (Tailwind + custom)
│
├── server/
│   └── index.ts                # Express.js server
│                               # - Serves static files from dist/public
│                               # - SPA fallback: serves index.html for all routes
│                               # - No API routes currently
│
├── shared/
│   └── const.ts                # Shared constants (exported from client/src/const.ts)
│
├── .aios-core/                 # AIOS framework (DO NOT MODIFY)
├── .claude/                    # Claude Code configuration
├── patches/                    # pnpm patch files (e.g., Wouter patch)
├── .manus-logs/                # Debug logs (Manus runtime plugin)
│
├── vite.config.ts             # Vite config (React, Tailwind, Manus plugin)
├── tsconfig.json              # TypeScript compiler config
├── package.json               # Dependencies, scripts, pnpm config
├── dist/                      # Build output (gitignored)
│   ├── public/                # React bundle (from Vite)
│   │   └── index.html
│   └── index.js               # Express server bundle (from esbuild)
│
└── node_modules/              # Dependencies (pnpm)
```

### Key Modules and Their Purpose

#### Pages (Route Components)

| File | Purpose | Key Features |
|------|---------|--------------|
| `Home.tsx` | Main landing page | Hero section, 4 category carousels (AI, Science, Robotics, Gadgets), trending articles, gadgets section, bilingual EN/PT-BR |
| `ArticleDetail.tsx` | Single article view | Full article content, author bio, comments section, ad banners (728x90 leaderboard), related articles |
| `CategoryPage.tsx` | Category-specific page | Grid of 12+ articles per category, dynamic category coloring (teal=AI, purple=Science, red=Robotics, orange=Gadgets) |
| `SearchPage.tsx` | Search results | Search input, results grid (TODO: connect to backend search) |
| `AboutPage.tsx` | About page | Static content about the news portal |
| `ContactPage.tsx` | Contact page | Contact form, embedded map (Google Maps) |
| `PrivacyPage.tsx` | Privacy policy | Static policy text |
| `TermsPage.tsx` | Terms of service | Static terms text |
| `NotFound.tsx` | 404 page | Fallback for unknown routes |

#### Components (UI & Layout)

| File | Purpose | State | Props |
|------|---------|-------|-------|
| `Header.tsx` | Top navigation | Manages language selection | `lang`, `onLangChange` |
| `Footer.tsx` | Footer links | None | N/A |
| `HeroSection.tsx` | Hero banner + featured article | Featured article index | `lang` |
| `ArticleCarousel.tsx` | Embla carousel for article cards | Hover glow state per category | `articles`, `category` |
| `LatestInCategory.tsx` | Latest 6 articles with rank badges | None | `articles`, `category` |
| `TrendingSection.tsx` | Trending articles sidebar carousel | None | Articles array |
| `GadgetsSection.tsx` | Product carousel (Amazon products) | None | Products array |
| `ArticlesSection.tsx` | Grid layout for category pages | None | Articles array |
| `CommentsSection.tsx` | Comments/discussion section | Comment form state | `articleId` |
| `SearchBar.tsx` | Search input (header) | Search query state | None |
| `Sidebar.tsx` | Right sidebar (trending articles) | None | Articles array |
| `Map.tsx` | Google Maps embed (contact page) | None | N/A |
| `ErrorBoundary.tsx` | Error fallback wrapper | Catches React errors | Wraps Router |
| `ManusDialog.tsx` | Custom dialog component | Dialog state | N/A |

#### UI Components (Radix + Tailwind)

40+ Radix UI primitives wrapped with Tailwind styling, located in `client/src/components/ui/`:

**Most Used**: `button`, `card`, `input`, `label`, `dialog`, `dropdown-menu`, `sheet`, `drawer`, `tabs`, `accordion`, `tooltip`, `alert`, `badge`, `alert-dialog`, `popover`, `hover-card`, `navigation-menu`, `pagination`, `scroll-area`, `slider`, `progress`, `chart`, `radio-group`, `select`, `switch`, `toggle-group`, `command`, `calendar`, `scroll-area`, `resizable`

#### Data & Utilities

| File | Purpose | Contents |
|------|---------|----------|
| `lib/data.ts` | Mock article database | `Article` type, array of 50+ articles across 4 categories, metadata |
| `lib/articleContent.ts` | Article body content | Full markdown-like content for each article (122KB file) |
| `lib/constants.ts` | App-level constants | Category configs, color mappings, category names |
| `lib/utils.ts` | Helper functions | Utility functions (minimal) |
| `const.ts` | OAuth/runtime config | `getLoginUrl()` function, environment variables |

---

## Design Patterns and Styling Architecture

### Cyberpunk Brutalism Design System

The portal follows a **cyberpunk brutalism aesthetic** with:

- **Color Palette**:
  - Background: `#0A0A0B` (near black)
  - Text: `#F0F0F5` (off-white)
  - Category neon colors:
    - **AI**: Teal/Cyan (`#06B6D4`, `rgb(6, 182, 212)`)
    - **Science**: Purple (`#A855F7`, `rgb(168, 85, 247)`)
    - **Robotics**: Red/Crimson (`#EF4444`, `rgb(239, 68, 68)`)
    - **Gadgets**: Orange (`#F97316`, `rgb(249, 115, 22)`)

- **Typography**:
  - Monospace font emphasis (inline code, labels)
  - Bold headlines (dark mode emphasis)
  - Contrast-heavy text styling

- **Visual Effects**:
  - Neon glow on hover (carousels, buttons)
  - Dashed borders on ad placeholders
  - Dark background with minimal white space
  - Grid-based layouts

### Tailwind CSS Configuration

**Tailwind v4** via `@tailwindcss/vite` plugin:
- Full responsive design support
- Custom color extensions for category neon colors
- Animation utilities (glowing effects, transitions)
- No CSS-in-JS, pure utility classes

**Key Tailwind Classes Used**:
```
bg-black, text-white, hover:shadow-[0_0_20px_...], 
rounded-lg, border-dashed, grid, gap-4, 
dark:bg-gray-900, dark:text-gray-100
```

### Component Styling Pattern

All components use:
1. **Radix UI primitives** for accessible base components
2. **Tailwind CSS** for styling (no CSS modules or BEM)
3. **Inline styles** for dynamic theming (color, background-color)
4. **clsx/tailwind-merge** for conditional classes

**Example**:
```tsx
<div className="flex items-center gap-4 rounded-lg bg-gray-900 px-4 py-2 hover:bg-gray-800">
  {/* Content */}
</div>
```

### Ad Banner Styling

All ad placeholders styled identically:
```tsx
<div style={{ 
  background: 'rgba(5,5,6,0.95)', 
  borderTop: '1px solid rgba(255,255,255,0.04)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  padding: '10px 2rem' 
}}>
  <div style={{ height: '64px', borderRadius: '4px', maxWidth: '728px' }} 
       className="ad-placeholder">
    <span>Google AdSense — Leaderboard 728×90</span>
  </div>
</div>
```

---

## Data Models and Types

### Core Data Types

All types defined in `client/src/lib/data.ts`:

```typescript
export type Category = 'AI' | 'SCIENCE' | 'ROBOTICS' | 'GADGETS';

export interface Article {
  id: number;
  title: { en: string; pt: string };        // Bilingual titles
  excerpt: { en: string; pt: string };      // Bilingual summaries
  category: Category;
  author: string;
  date: string;                              // Format: "2026-04-16"
  readTime: string;                          // Format: "5 min read"
  views: string;                             // Format: "1.2K views"
  image: string;                             // Full CDN URL
  featured?: boolean;                        // Hero section flag
}

export interface GadgetProduct {
  id: number;
  name: string;
  category: string;
  rating: number;                            // 0-5 stars
  reviews: number;
  image: string;                             // CDN URL
  amazonUrl: string;                         // Amazon affiliate link
  badge: string;                             // "Best Seller", "New", etc.
}
```

### Data Source

- **Articles**: ~50+ mock articles in `client/src/lib/data.ts`, distributed across 4 categories
- **Images**: CDN hosted on Manus (private-us-east-1.manuscdn.com)
- **Gadgets**: ~12 mock products with Amazon affiliate links

### Article Content

Article body content stored separately in `client/src/lib/articleContent.ts` (~122KB):
- Markdown-like format (headings, paragraphs)
- Lazy-loaded on ArticleDetail page
- No database backend

---

## Routing and Navigation

### Route Definition (App.tsx)

All routes defined in `Router()` component using Wouter:

```tsx
<Switch>
  <Route path={"/"} component={Home} />
  <Route path={"/article/:id"} component={ArticleDetail} />
  <Route path={"/ai"} component={() => <CategoryPage category="AI" />} />
  <Route path={"/science"} component={() => <CategoryPage category="SCIENCE" />} />
  <Route path={"/robotics"} component={() => <CategoryPage category="ROBOTICS" />} />
  <Route path={"/gadgets"} component={() => <CategoryPage category="GADGETS" />} />
  <Route path={"/about"} component={AboutPage} />
  <Route path={"/contact"} component={ContactPage} />
  <Route path={"/privacy"} component={PrivacyPage} />
  <Route path={"/terms"} component={TermsPage} />
  <Route path={"/search"} component={SearchPage} />
  <Route path={"/404"} component={NotFound} />
  <Route component={NotFound} />  <!-- Catch-all fallback -->
</Switch>
```

### Wouter Router Behavior

- Client-side routing only (no server-side navigation)
- Supports hash-based navigation (e.g., `/#section-ai`)
- Home page uses `location.hash` to auto-scroll to sections
- No query parameter handling (search TODO)

---

## Technical Debt and Known Issues

### Current Limitations

1. **No Backend API**
   - All data is mock (hardcoded in client)
   - No database persistence
   - **Impact**: Search, contact form, comments are not functional
   - **Workaround**: Data lives in `client/src/lib/data.ts`

2. **Search Page Not Implemented**
   - Route exists (`/search`) but no filtering logic
   - **Impact**: Search bar doesn't work
   - **Fix needed**: Implement client-side filtering or backend API

3. **Contact Form Not Connected**
   - Form UI exists but doesn't submit anywhere
   - **Impact**: Contact inquiries are lost
   - **Fix needed**: Add email backend or third-party service (SendGrid, etc.)

4. **Comments Section Mock**
   - Comments don't persist
   - **Impact**: User engagement features non-functional
   - **Fix needed**: Backend comments API

5. **Ad Placeholders Only**
   - All Google AdSense placeholders (728x90 leaderboard banners)
   - No actual ad serving
   - **Impact**: No monetization
   - **Integration needed**: Connect to Google AdSense Publisher

6. **Wouter Patch Required**
   - Dependency: `wouter@3.3.5` with pnpm patch applied
   - **Location**: `patches/wouter@3.7.1.patch`
   - **Reason**: Bug fix not yet upstream
   - **Risk**: Upgrading Wouter may break navigation

### Design Debt

1. **Bilingual Strings in Components**
   - English/Portuguese logic scattered across components
   - **Impact**: Hard to maintain, no i18n framework
   - **Better approach**: Use i18next or react-i18next

2. **Inline Styles Mixed with Tailwind**
   - Some components use inline `style={}` props
   - **Impact**: CSS scattered, harder to refactor
   - **Example**: Ad placeholders, hero section layout

3. **Magic Numbers in Styling**
   - Grid columns, gaps, padding values hardcoded
   - **Example**: `gridTemplateColumns: '1fr 320px'` in Home.tsx
   - **Better approach**: Extract to Tailwind config or constants

4. **Category Color Hardcoding**
   - Color strings duplicated across components
   - **Location**: ArticleCarousel.tsx, LatestInCategory.tsx
   - **Better approach**: Extract to theme provider or constants

### Performance Considerations

- **Bundle Size**: React 19 + 40+ Radix UI components + Recharts (unused) → ~500KB gzipped estimate
- **Article Content**: articleContent.ts is 122KB (lazy-loaded)
- **Images**: All CDN hosted (no optimization tuning visible)
- **No Code Splitting**: Everything in single bundle (Vite default)

---

## Integration Points and External Dependencies

### External Services

| Service | Purpose | Integration Type | Location | Status |
|---------|---------|------------------|----------|--------|
| Google Maps | Contact page map embed | iframe/SDK | `client/src/components/Map.tsx` | Integrated (types from `@types/google.maps`) |
| Google AdSense | Ad serving | Placeholder banners | `Home.tsx`, `ArticleDetail.tsx` | Placeholder only, not connected |
| Manus CDN | Image hosting | Direct image URLs | `client/src/lib/data.ts` | All images hosted here |
| Amazon Associates | Product links | Affiliate links | `GadgetsSection.tsx` | Mock products with amazonUrl |

### Internal Integration Points

1. **Theme Context**
   - Provides dark/light mode to entire app
   - Wrapped in App.tsx root
   - **Used by**: All components that respect theme

2. **Wouter Router**
   - All navigation goes through Wouter
   - Server redirects unknown routes to SPA (Express middleware)

3. **Error Boundary**
   - Catches React component errors
   - Wrapped around entire Router in App.tsx

4. **Toast Notifications**
   - Sonner toasts available globally
   - `<Toaster />` in App.tsx

### Server Routes

Express server (`server/index.ts`):
```ts
app.use(express.static(staticPath));  // Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));  // SPA fallback
});
```

**No API routes** — all data is client-side.

---

## Development Workflow

### Local Development Setup

1. **Prerequisites**: Node.js 18+, pnpm 10.4.1+
2. **Install dependencies**: `pnpm install`
3. **Start dev server**: `npm run dev` (Vite on port 3000)
4. **Type checking**: `npm run check` (runs `tsc --noEmit`)
5. **Linting**: `npm run lint` (ESLint on client/src/)
6. **Format code**: `npm run format` (Prettier on entire project)

### Development Server (Vite)

- Runs on `http://localhost:3000`
- Hot Module Reload (HMR) enabled
- TypeScript errors shown in browser
- CSS hot reload for Tailwind
- **Manus Debug Plugin**: Logs collected to `.manus-logs/`

### Important Development Notes

- **No Backend Development**: All logic is client-side
- **Mock Data Only**: Cannot test real API scenarios
- **Images from CDN**: Manus CDN URLs used (may have expiration)
- **ES Modules Only**: `"type": "module"` in package.json

---

## Build and Deployment

### Build Process

**Command**: `npm run build`

```bash
# Step 1: Vite builds React → dist/public/
vite build

# Step 2: esbuild bundles Node server → dist/index.js
esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist
```

**Outputs**:
- `dist/public/index.html` — SPA entry point
- `dist/public/assets/` — Bundled React + CSS + images
- `dist/index.js` — Express server binary

### Production Deployment

**Command**: `npm start` (runs `NODE_ENV=production node dist/index.js`)

- Starts Express server on port `$PORT` (default: 3000)
- Serves static files from `dist/public/`
- All routes → `index.html` (SPA fallback)
- **No API endpoints** — just serving static SPA

### Build Optimization Opportunities

1. **Code Splitting**: No current splitting, consider Vite's dynamic imports
2. **Image Optimization**: CDN images not optimized, could use next-gen formats
3. **Recharts Unused**: Can be removed (~30KB gzipped savings)
4. **Radix Components**: Bundle only used components
5. **Tree-shaking**: Ensure unused dependencies are removed

---

## Testing Reality

### Current State

- **No unit tests** — No Jest/Vitest files found
- **No integration tests** — No test files in codebase
- **No E2E tests** — No Cypress/Playwright tests
- **Manual testing only** — Primary QA method

### Testing Recommendations

1. **Unit Tests**: Component snapshot tests (Vitest)
2. **Integration Tests**: Route navigation, data loading
3. **E2E Tests**: Full user flows (search, article detail, contact form)

### Type Safety

- **TypeScript enabled**: `npm run check` verifies types
- **Strict mode**: All components in strict mode
- **No type errors on main branch**

---

## Browser Compatibility & Accessibility

### Browser Support

- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **React 19**: Requires ES2020+ support
- **CSS Grid**: No IE11 support (modern only)
- **Tailwind v4**: Requires modern CSS support

### Accessibility

- **Radix UI**: Provides accessible primitives (ARIA)
- **Error Boundary**: Catches unhandled errors
- **Semantic HTML**: Article markup is semantic
- **Color Contrast**: Dark theme may have issues, should audit

### SEO Considerations

- **Language Tag**: Dynamic `<html lang>` set based on selected language
- **No Meta Tags**: No current SEO optimization (title, description)
- **SPA Limitations**: Client-side rendering, search engines see initial HTML only
- **Opportunity**: Add Helmet or similar for meta tag management

---

## Key Files Deep Dive

### Home.tsx — Landing Page

```tsx
// Design: Header → AdBanner → Hero+Sidebar → AdBanner → Trending → Gadgets → Footer
// Bilingual: EN / PT-BR
// State: lang (en/pt), location for hash scrolling
// Features:
//   - Category carousels with neon glow on hover
//   - Auto-scroll to sections via hash (/#section-ai)
//   - Ad leaderboard banners (728x90) between sections
//   - Sidebar with trending articles
```

**Key Logic**:
- `useEffect` to sync `<html lang>` for screen readers
- Hash-based scroll with retry logic (up to 10 attempts)
- Layout: `gridTemplateColumns: '1fr 320px'` (main + sidebar)

### ArticleCarousel.tsx — Category Carousels

```tsx
// Embla carousel for each category (AI, Science, Robotics, Gadgets)
// Dynamic neon glow: category-specific color on hover
// Inline onMouseEnter/onMouseLeave handlers (NO global CSS rules)
// Prevents cross-contamination between carousel categories
```

**Key Features**:
- Per-card accentColorRgb prop
- Neon glow effect: `box-shadow: 0 0 20px {color}`
- Responsive carousel navigation

### ArticleDetail.tsx — Article Page

```tsx
// Layout: Header → AdBanner → Article Content → Author Bio → AdBanner → Comments → Related
// Features:
//   - Full article markdown-like content (from articleContent.ts)
//   - Author bio section
//   - Comments section (mock, no persistence)
//   - AdSense leaderboard banner above comments
//   - Related articles carousel
```

**Data Flow**:
- Article ID from URL param (`:id`)
- Fetch article from mock data (`data.ts`)
- Fetch article content from articleContent.ts

### ArticleCarousel.tsx — Hover Effect Pattern

**Recent Change**: Replaced global CSS `.carousel-card:hover` with inline handlers:

```tsx
onMouseEnter={() => setHoveredCardId(cardId)}
onMouseLeave={() => setHoveredCardId(null)}
```

**Why**: Global CSS rule caused all cards to share same color. Inline handlers allow each card to use its own `accentColorRgb` prop.

---

## Patterns and Conventions

### Component Naming

- **Pages**: PascalCase, match route names (Home, ArticleDetail, CategoryPage)
- **Components**: PascalCase, descriptive (Header, HeroSection, ArticleCarousel)
- **UI Primitives**: ui/component-name.tsx (lowercase, kebab-case)
- **Contexts**: PascalCase + Context suffix (ThemeContext)
- **Utilities**: camelCase (getLoginUrl, formatDate)

### State Management

- **React Hooks Only**: No Redux, Zustand, or Recoil
- **Local State**: useState for component-level state
- **Context**: ThemeContext for app-level theme
- **No Global Store**: Each component manages its own state

### Styling Approach

- **Tailwind Classes**: Primary styling method
- **Inline Styles**: For dynamic values (colors, layout)
- **No CSS Modules**: Everything utility-based
- **No CSS-in-JS**: Plain CSS in `index.css`

### File Organization

- **Flat structure**: `src/components/`, `src/pages/`, `src/lib/`
- **No subdirectories**: For simplicity
- **Shared types**: In respective data files or interfaces

### Error Handling

- **Error Boundary**: Top-level error catcher (ErrorBoundary.tsx)
- **No try/catch**: Minimal error handling in components
- **Fallback UI**: 404 page for unknown routes

---

## Environment Variables and Configuration

### Runtime Configuration

**In `client/src/const.ts`**:
```typescript
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // ...
}
```

**Environment Variables Needed**:
- `VITE_OAUTH_PORTAL_URL` — OAuth portal base URL
- `VITE_APP_ID` — Application ID for OAuth

### Build Environment

**In `server/index.ts`**:
```typescript
const staticPath = process.env.NODE_ENV === "production"
  ? path.resolve(__dirname, "public")
  : path.resolve(__dirname, "..", "dist", "public");
```

**Environment Variables**:
- `NODE_ENV` — "development" or "production"
- `PORT` — Server port (default: 3000)

---

## Useful Commands and Troubleshooting

### Common Commands

```bash
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Build for production
npm start                # Start production server
npm run preview          # Preview production build locally
npm run check            # TypeScript type check
npm run lint             # ESLint on client/src
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format all files (Prettier)
npm run format:check     # Check if files are formatted
```

### Debugging

**Browser Console**:
- Vite errors shown directly in browser
- No backend errors to debug

**Debug Logs**:
- Manus logs: `.manus-logs/browserConsole.log`, `networkRequests.log`
- Check for JavaScript errors in browser console

**TypeScript Errors**:
- `npm run check` shows all type errors
- Must fix before committing

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Port 3000 busy | Another process using port | Vite auto-finds next port (strictPort: false) |
| Module not found | Path alias issue | Check `tsconfig.json` paths (@/, @shared/) |
| Tailwind styles not applied | CSS not compiled | Run `npm run dev` to start Vite |
| Articles don't load | Mock data issue | Check `client/src/lib/data.ts` |
| Images not loading | CDN expired or offline | Check Manus CDN status |

---

## Future Enhancements (Not Current Scope)

1. **Backend API**: Node.js API for articles, search, comments
2. **Database**: PostgreSQL for article persistence
3. **User Authentication**: OAuth/JWT login system
4. **Search Functionality**: Full-text search on articles
5. **Comments System**: Real comment persistence and threads
6. **Email Notifications**: SendGrid integration for contact form
7. **AdSense Integration**: Real Google AdSense account
8. **Analytics**: Google Analytics or similar
9. **Performance**: Code splitting, image optimization, caching
10. **Testing**: Unit and E2E test coverage
11. **i18n Framework**: Proper translation system (currently manual)

---

## Architecture Decision Log

### Why Wouter Instead of React Router?

- **Lightweight**: ~1.5KB vs ~40KB for React Router
- **SPA simplicity**: Perfect for client-side routing without server support
- **Trade-off**: Less feature-rich (no nested routes, loaders, actions)

### Why Radix UI + Tailwind Instead of Material-UI?

- **Headless + Styled**: Complete control over styling
- **Accessibility**: Radix provides ARIA out of box
- **Tailwind efficiency**: Utility-first, smaller bundle
- **Cyberpunk aesthetic**: Better control over neon/dark theme

### Why Mock Data Instead of Backend API?

- **Simplicity**: No server setup needed during development
- **Standalone**: Can run frontend without backend
- **Trade-off**: Cannot test real data scenarios, no persistence

### Why Single Express Server Instead of Separate Backend?

- **Deployment simplicity**: One Node.js process to manage
- **Server needed anyway**: Must serve SPA static files
- **Trade-off**: Limited separation of concerns
- **Future improvement**: Split into separate backend API + static host

---

## Appendix — Important Notes for Contributors

### Before Making Changes

1. **Run `npm run check`** to verify TypeScript types
2. **Run `npm run lint`** to check code style
3. **Run `npm run format`** to apply code formatting
4. **Review existing patterns** before introducing new ones
5. **Avoid adding new dependencies** without discussion

### Adding New Pages

1. Create `client/src/pages/MyPage.tsx`
2. Add route in `client/src/App.tsx` Router
3. Import page component in App.tsx
4. Test route navigation works

### Adding New Components

1. Create `client/src/components/MyComponent.tsx`
2. Export component from file
3. Import and use in pages/other components
4. Follow existing styling patterns (Tailwind + Radix)

### Modifying Styles

1. Use Tailwind classes first (utility-based)
2. Only use inline styles for dynamic values
3. Keep category colors in constants
4. Test responsive design (mobile/tablet/desktop)

### Adding New Data

1. Add to `client/src/lib/data.ts` if articles
2. Update type definitions if new fields
3. Update components that render data
4. Test in all affected pages

---

## References and Resources

- **Vite Docs**: https://vitejs.dev/guide/
- **React 19**: https://react.dev/
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **Wouter Router**: https://github.com/molefrog/wouter
- **TypeScript**: https://www.typescriptlang.org/docs/

---

**Document Last Updated**: 2026-04-16  
**Version**: 1.0  
**Status**: Approved for AI Agent Development
