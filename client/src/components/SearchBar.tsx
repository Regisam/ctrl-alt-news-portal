// CTRL + ALT News — SearchBar Component
// Design: Cyberpunk Brutalism — expanding input, neon-bordered dropdown, category badges
// Features:
//   • Real-time filtering by title (EN+PT), category, and author
//   • Instant dropdown with up to 6 preview results
//   • Keyboard navigation (↑ ↓ Enter Escape)
//   • Click outside to close
//   • "View all N results" footer → navigates to /search?q=...
//   • On form submit → navigates to /search?q=...

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Search, X, ChevronRight } from "lucide-react";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  type CategoryArticle,
} from "@/lib/data";

// ─── All articles pool ────────────────────────────────────────────────────────
// NOTE: When new articles are added to aiArticles, scienceArticles, or
// roboticsArticles in data.ts, they will automatically appear in search results.

const ALL_ARTICLES: CategoryArticle[] = [
  ...aiArticles,
  ...scienceArticles,
  ...roboticsArticles,
].filter(
  // deduplicate by id
  (a, idx, arr) => arr.findIndex((b) => b.id === a.id) === idx
);

// ─── Category accent colours ──────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  AI:       "#00D4FF",
  SCIENCE:  "#A855F7",
  ROBOTICS: "#EF4444",
  GADGETS:  "#F97316",
};

// ─── Search logic ─────────────────────────────────────────────────────────────

function searchArticles(query: string, lang: "en" | "pt"): CategoryArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_ARTICLES.filter((a) => {
    const title = (a.title[lang] ?? a.title.en).toLowerCase();
    const titleOther = (lang === "en" ? a.title.pt : a.title.en).toLowerCase();
    const author = a.author.toLowerCase();
    const category = a.category.toLowerCase();
    return (
      title.includes(q) ||
      titleOther.includes(q) ||
      author.includes(q) ||
      category.includes(q)
    );
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const [, navigate] = useLocation();
  const { i18n } = useTranslation();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const PREVIEW_LIMIT = 6;

  // ── Close search helper ──────────────────────────────────────────────────────
  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlighted(-1);
  }, []);

  const computedResults = useMemo(() => searchArticles(query, i18n.language as 'en' | 'pt'), [query, i18n.language]);

  // ── Click outside to close ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const previewCount = Math.min(computedResults.length, PREVIEW_LIMIT);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, previewCount - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlighted >= 0 && computedResults[highlighted]) {
          navigate(`/article/${computedResults[highlighted].id}`);
          closeSearch();
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
          closeSearch();
        }
      } else if (e.key === "Escape") {
        closeSearch();
      }
    },
    [highlighted, computedResults, query, navigate, closeSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const preview = computedResults.slice(0, PREVIEW_LIMIT);
  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* ── Collapsed button ── */}
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={t('searchBar.openSearch')}
          className="focus-neon search-toggle-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            padding: "6px 12px",
            color: "rgba(240,240,245,0.5)",
            fontSize: "0.8rem",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Search size={14} aria-hidden="true" />
          <span className="hidden lg:inline">{t('searchBar.search')}</span>
        </button>
      )}

      {/* ── Expanded search form ── */}
      {open && (
        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label={t('searchBar.placeholder')}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.35)",
                pointerEvents: "none",
              }}
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('searchBar.placeholder')}
              aria-label={t('searchBar.placeholder')}
              aria-autocomplete="list"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="search-results"
              autoComplete="off"
              style={{
                paddingLeft: "32px",
                paddingRight: "12px",
                paddingTop: "7px",
                paddingBottom: "7px",
                borderRadius: "4px",
                fontSize: "0.85rem",
                width: "260px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(0,212,255,0.35)",
                color: "#e2e8f0",
                fontFamily: "var(--font-body)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>
          <button
            type="button"
            onClick={closeSearch}
            aria-label={t('searchBar.close')}
            style={{
              background: "none",
              border: "none",
              color: "rgba(240,240,245,0.45)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </form>
      )}

      {/* ── Dropdown results ── */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label={t('searchBar.searchResults')}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "360px",
            background: "rgba(10,10,15,0.98)",
            border: "1px solid rgba(0,212,255,0.25)",
            borderRadius: "10px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.08)",
            backdropFilter: "blur(20px)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {preview.length === 0 ? (
            <div style={{ padding: "20px 16px", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", textAlign: "center" }}>
              {t('searchBar.noResults')}
            </div>
          ) : (
            <>
              <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
                {preview.map((article, idx) => {
                  const isHighlighted = idx === highlighted;
                  const color = CAT_COLOR[article.category] ?? "#00D4FF";
                  return (
                    <li
                      key={article.id}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/article/${article.id}`);
                          closeSearch();
                        }}
                        onMouseEnter={() => setHighlighted(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          width: "100%",
                          padding: "10px 14px",
                          background: isHighlighted ? "rgba(0,212,255,0.07)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: "48px",
                            height: "36px",
                            borderRadius: "5px",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: `1px solid ${color}33`,
                          }}
                        >
                          <img
                            src={article.image}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              color: isHighlighted ? "#fff" : "rgba(255,255,255,0.8)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              lineHeight: 1.35,
                              margin: "0 0 4px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {article.title[i18n.language as 'en' | 'pt'] ?? article.title.en}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                letterSpacing: "0.1em",
                                color,
                                background: `${color}18`,
                                border: `1px solid ${color}44`,
                                borderRadius: "3px",
                                padding: "1px 5px",
                              }}
                            >
                              {article.category}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                              {article.author}
                            </span>
                          </div>
                        </div>

                        <ChevronRight size={13} style={{ color: isHighlighted ? color : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* View all footer */}
              {computedResults.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                      closeSearch();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#00D4FF",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-body)",
                      padding: 0,
                    }}
                  >
                    {i18n.language === 'en'
                      ? `View all ${computedResults.length} result${computedResults.length !== 1 ? 's' : ''}`
                      : `Ver todos os ${computedResults.length} resultado${computedResults.length !== 1 ? 's' : ''}`}
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
