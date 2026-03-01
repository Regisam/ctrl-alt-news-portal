// CTRL + ALT News — LatestInCategory Sidebar Widget
// Design: Cyberpunk Brutalism — dark glassmorphism, neon category accents
//
// Logic:
//   • Accepts the current article's category and ID.
//   • Pulls from the matching category array (aiArticles | scienceArticles |
//     roboticsArticles | gadgetProducts).
//   • Sorts by date descending (most recent first) and takes the last 10.
//   • Excludes the article currently being read.
//   • When new articles are added to data.ts they appear here automatically;
//     when there are more than 10, the oldest is pushed out of the list.
//
// NOTE FOR FUTURE EDITORS:
//   To add a new category, import its array below and add a branch in
//   getLatestArticles(). The widget will automatically show up to 10 articles
//   sorted by date, replacing the oldest when a new one is added.

import { useMemo } from "react";
import { Link } from "wouter";
import { Clock, Eye, ChevronRight } from "lucide-react";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  gadgetProducts,
  type CategoryArticle,
} from "@/lib/data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(dateStr: string): number {
  // Expected format: "Feb 24, 2026"
  const parts = dateStr.split(" ");
  if (parts.length < 3) return 0;
  const month = MONTH_MAP[parts[0]] ?? 0;
  const day = parseInt(parts[1].replace(",", ""), 10);
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day).getTime();
}

function getLatestArticles(
  category: string,
  currentId: number
): CategoryArticle[] {
  let pool: CategoryArticle[] = [];

  if (category === "AI") pool = aiArticles;
  else if (category === "SCIENCE") pool = scienceArticles;
  else if (category === "ROBOTICS") pool = roboticsArticles;
  else if (category === "GADGETS") pool = gadgetProducts as unknown as CategoryArticle[];

  return [...pool]
    .filter((a) => a.id !== currentId)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, 10); // max 10 — oldest auto-dropped when new ones are added
}

// ─── Category style map ───────────────────────────────────────────────────────

const CAT_STYLES: Record<string, { color: string; label: string; labelPt: string }> = {
  AI:       { color: "#00D4FF", label: "Latest in Artificial Intelligence", labelPt: "Últimas em Inteligência Artificial" },
  SCIENCE:  { color: "#A855F7", label: "Latest in Science",                labelPt: "Últimas em Ciência" },
  ROBOTICS: { color: "#EF4444", label: "Latest in Robotics",               labelPt: "Últimas em Robótica" },
  GADGETS:  { color: "#F97316", label: "Latest in Gadgets",                labelPt: "Últimas em Gadgets" },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface LatestInCategoryProps {
  category: string;
  currentArticleId: number;
  lang: "en" | "pt";
}

export default function LatestInCategory({
  category,
  currentArticleId,
  lang,
}: LatestInCategoryProps) {
  const articles = useMemo(
    () => getLatestArticles(category, currentArticleId),
    [category, currentArticleId]
  );

  const style = CAT_STYLES[category] ?? CAT_STYLES["AI"];
  const heading = lang === "pt" ? style.labelPt : style.label;
  const emptyMsg =
    lang === "pt"
      ? "Nenhum outro artigo nesta categoria ainda."
      : "No other articles in this category yet.";

  return (
    <aside
      aria-label={heading}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${style.color}33`,
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            width: "32px",
            height: "2px",
            background: style.color,
            marginBottom: "10px",
            borderRadius: "2px",
          }}
        />
        <h3
          style={{
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {heading}
        </h3>
      </div>

      {/* Article list */}
      {articles.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
          {emptyMsg}
        </p>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          {articles.map((article, idx) => (
            <li key={article.id}>
              <Link
                href={`/article/${article.id}`}
                aria-label={`Read: ${article.title[lang] ?? article.title.en}`}
                style={{ display: "flex", gap: "12px", alignItems: "flex-start", textDecoration: "none" }}
              >
                {/* Rank number */}
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    color: idx < 3 ? style.color : "rgba(255,255,255,0.2)",
                    minWidth: "22px",
                    lineHeight: 1,
                    paddingTop: "2px",
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Thumbnail */}
                <div
                  style={{
                    width: "56px",
                    height: "42px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: `1px solid ${style.color}33`,
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
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      lineHeight: 1.4,
                      margin: "0 0 5px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      transition: "color 0.2s",
                    }}
                    className="latest-title"
                  >
                    {article.title[lang] ?? article.title.en}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.68rem",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <Clock size={9} /> {article.readTime}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <Eye size={9} /> {article.views}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                  size={14}
                  style={{ color: style.color, flexShrink: 0, marginTop: "2px", opacity: 0.7 }}
                />
              </Link>
            </li>
          ))}
        </ol>
      )}

      {/* Hover style injected once */}
      <style>{`
        .latest-title:hover { color: ${style.color} !important; }
      `}</style>
    </aside>
  );
}
