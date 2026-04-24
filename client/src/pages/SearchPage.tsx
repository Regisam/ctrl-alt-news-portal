// CTRL + ALT News — Search Results Page (/search?q=...)
// Design: Cyberpunk Brutalism — neon-bordered result cards, category badges, bilingual
// Features:
//   • Reads ?q= from URL, filters all articles by title (EN+PT), category, author
//   • Shows total count, category filter tabs, and sorted results
//   • Automatically includes new articles added to data.ts

import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Search, Clock, Eye, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  type CategoryArticle,
} from "@/lib/data";

// ─── All articles pool ────────────────────────────────────────────────────────
// NOTE: Add new article arrays here when new categories are created.
const ALL_ARTICLES: CategoryArticle[] = [
  ...aiArticles,
  ...scienceArticles,
  ...roboticsArticles,
].filter((a, idx, arr) => arr.findIndex((b) => b.id === a.id) === idx);

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  AI:       "#00D4FF",
  SCIENCE:  "#A855F7",
  ROBOTICS: "#EF4444",
  GADGETS:  "#F97316",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function filterArticles(
  articles: CategoryArticle[],
  query: string,
  lang: "en" | "pt",
  category: string
): CategoryArticle[] {
  const q = query.toLowerCase().trim();
  return articles.filter((a) => {
    const matchesCategory = category === "ALL" || a.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    const titleEn = a.title.en.toLowerCase();
    const titlePt = a.title.pt.toLowerCase();
    const author = a.author.toLowerCase();
    const cat = a.category.toLowerCase();
    return (
      titleEn.includes(q) ||
      titlePt.includes(q) ||
      author.includes(q) ||
      cat.includes(q)
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [lang, setLang] = useState<"en" | "pt">("en");
  const [, navigate] = useLocation();
  const initialQuery = useMemo(() => getQuery(), []);
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [inputValue, setInputValue] = useState(initialQuery);

  const results = useMemo(
    () => filterArticles(ALL_ARTICLES, query, lang, activeCategory),
    [query, lang, activeCategory]
  );

  const categories = useMemo(() => {
    const cats = new Set(
      filterArticles(ALL_ARTICLES, query, lang, "ALL").map((a) => a.category)
    );
    return ["ALL", ...Array.from(cats)];
  }, [query, lang]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
      setQuery(inputValue.trim());
      setActiveCategory("ALL");
    }
  };

  const t = {
    en: {
      results: (n: number) => `${n} result${n !== 1 ? "s" : ""} for`,
      noResults: "No results found",
      noResultsHint: "Try a different keyword, category, or author name.",
      allCategories: "ALL",
      placeholder: "Search articles, categories, authors…",
      back: "Back",
    },
    pt: {
      results: (n: number) => `${n} resultado${n !== 1 ? "s" : ""} para`,
      noResults: "Nenhum resultado encontrado",
      noResultsHint: "Tente outra palavra-chave, categoria ou nome de autor.",
      allCategories: "TODOS",
      placeholder: "Buscar artigos, categorias, autores…",
      back: "Voltar",
    },
  }[lang];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
      <Header lang={lang} onLangChange={setLang} />

      <main style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: "900px" }}>

          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              cursor: "pointer",
              marginBottom: "24px",
              padding: 0,
              fontFamily: "var(--font-body)",
            }}
          >
            <ArrowLeft size={14} />
            {t.back}
          </button>

          {/* Search bar */}
          <form onSubmit={handleNewSearch} style={{ marginBottom: "32px" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.35)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                style={{
                  width: "100%",
                  paddingLeft: "48px",
                  paddingRight: "16px",
                  paddingTop: "14px",
                  paddingBottom: "14px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "#e2e8f0",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </form>

          {/* Results count */}
          {query && (
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", marginBottom: "20px" }}>
              {t.results(filterArticles(ALL_ARTICLES, query, lang, "ALL").length)}{" "}
              <strong style={{ color: "#00D4FF" }}>&ldquo;{query}&rdquo;</strong>
            </p>
          )}

          {/* Category filter tabs */}
          {categories.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "28px",
              }}
            >
              {categories.map((cat) => {
                const isActive = cat === activeCategory;
                const color = cat === "ALL" ? "#00D4FF" : (CAT_COLOR[cat] ?? "#00D4FF");
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: isActive ? `${color}22` : "transparent",
                      border: `1px solid ${isActive ? color : "rgba(255,255,255,0.12)"}`,
                      color: isActive ? color : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {cat === "ALL" ? t.allCategories : cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results grid */}
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.35)" }}>
              <Search size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t.noResults}</p>
              <p style={{ fontSize: "0.85rem" }}>{t.noResultsHint}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {results.map((article) => {
                const color = CAT_COLOR[article.category] ?? "#00D4FF";
                return (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <article
                      style={{
                        display: "flex",
                        gap: "16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "10px",
                        padding: "16px",
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${color}55`;
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "100px",
                          height: "70px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        <img
                          src={article.image}
                          alt=""
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              letterSpacing: "0.12em",
                              color,
                              background: `${color}18`,
                              border: `1px solid ${color}44`,
                              borderRadius: "3px",
                              padding: "2px 6px",
                            }}
                          >
                            {article.category}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                            {article.author}
                          </span>
                        </div>
                        <h3
                          style={{
                            color: "#e2e8f0",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            lineHeight: 1.4,
                            margin: "0 0 8px",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {article.title[lang] ?? article.title.en}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                            <Clock size={11} />
                            {article.readTime}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                            <Eye size={11} />
                            {article.views}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                            {article.date}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
