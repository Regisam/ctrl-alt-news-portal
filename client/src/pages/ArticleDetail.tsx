// CTRL + ALT News — Article Detail Page
// Design: Cyberpunk Brutalism — deep matte charcoal, neon category accents, glassmorphism
// Layout: Full-width hero → constrained body column → related articles grid

import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Eye,
  Calendar,
  Share2,
  Twitter,
  Linkedin,
  Link2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import Header from "@/components/Header";
import CommentsSection from "@/components/CommentsSection";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import LatestInCategory from "@/components/LatestInCategory";
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from "@/lib/data";
import { articleBodies } from "@/lib/articleContent";
import type { Article } from "@/lib/data";

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  AI: {
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.12)",
    border: "rgba(0,212,255,0.4)",
    glow: "0 0 20px rgba(0,212,255,0.3)",
  },
  SCIENCE: {
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.4)",
    glow: "0 0 20px rgba(168,85,247,0.3)",
  },
  ROBOTICS: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.4)",
    glow: "0 0 20px rgba(239,68,68,0.3)",
  },
  GADGETS: {
    color: "#F97316",
    bg: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.4)",
    glow: "0 0 20px rgba(249,115,22,0.3)",
  },
};

const ALL_ARTICLES: Article[] = [
  ...aiArticles,
  ...scienceArticles,
  ...roboticsArticles,
  ...trendingArticles,
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ArticleDetail() {
  const params = useParams<{ id: string }>();
  const articleId = parseInt(params.id || "0", 10);
  const [lang, setLang] = useState<"en" | "pt">(() => {
    const stored = localStorage.getItem("ctrl-alt-lang") as "en" | "pt" | null;
    return stored || "en";
  });

  function handleLangChange(newLang: "en" | "pt") {
    setLang(newLang);
    localStorage.setItem("ctrl-alt-lang", newLang);
    document.documentElement.lang = newLang === "pt" ? "pt-BR" : "en-UK";
  }

  useEffect(() => {
    const handler = () => {
      const updated = localStorage.getItem("ctrl-alt-lang") as "en" | "pt" | null;
      if (updated) setLang(updated);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [articleId]);

  const article = ALL_ARTICLES.find((a) => a.id === articleId);
  const body = articleBodies.find((b) => b.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#0A0A0B" }}>
        <p className="text-white text-2xl font-bold mb-4">Article not found</p>
        <Link href="/" className="text-[#00D4FF] hover:underline">← Back to Home</Link>
      </div>
    );
  }

  const catStyle = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.AI;
  const bodyContent = body?.body[lang] || body?.body.en || [];
  const authorBio = body?.authorBio[lang] || body?.authorBio.en || "";
  const tags = body?.tags || [];

  // Related articles: same category, different id, max 3
  const related = ALL_ARTICLES
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied to clipboard!");
    });
  }

  function shareTwitter() {
    const text = encodeURIComponent(article?.title[lang] || article?.title.en || "");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  }

  function shareLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0B" }}>
      <Header lang={lang} onLangChange={handleLangChange} />

      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "480px" }}>
        <img
          src={article.image}
          alt={article.title[lang] || article.title.en}
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,11,0.2) 0%, rgba(10,10,11,0.6) 50%, rgba(10,10,11,0.97) 100%)",
          }}
        />
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
          style={{
            background: "rgba(10,10,11,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "8px 14px",
            borderRadius: "6px",
            backdropFilter: "blur(8px)",
          }}
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        {/* Hero text overlay */}
        <div className="absolute bottom-0 right-0 px-6 pb-8 max-w-4xl mx-auto w-full" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {/* Category badge */}
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded mb-4"
            style={{
              color: catStyle.color,
              background: catStyle.bg,
              border: `1px solid ${catStyle.border}`,
            }}
          >
            {article.category}
          </span>
          <h1
            className="text-3xl md:text-4xl font-black text-white leading-tight mb-4"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            {article.title[lang] || article.title.en}
          </h1>
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: catStyle.bg, border: `1px solid ${catStyle.border}` }}
              >
                {getInitials(article.author ?? "")}
              </div>
              <span className="text-white/90 font-medium">{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={13} />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={13} />
              <span>{article.views} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content + Sidebar ── */}
      <div className="flex-1 w-full" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div
          className="article-detail-layout"
          style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "40px", alignItems: "start", paddingTop: "2.5rem", paddingBottom: "3rem" }}
        >
        {/* Left: article body */}
        <div>
        {/* Excerpt */}
        <p
          className="text-lg leading-relaxed mb-8 font-medium"
          style={{ color: "rgba(255,255,255,0.75)", borderLeft: `3px solid ${catStyle.color}`, paddingLeft: "1.25rem" }}
        >
          {article.excerpt[lang] || article.excerpt.en}
        </p>

        {/* AdSense leaderboard mid-article */}
        <div
          className="w-full flex items-center justify-center mb-10 rounded"
          style={{
            height: "90px",
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.12)",
          }}
        >
          <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
            Google AdSense — Leaderboard 728×90
          </span>
        </div>

        {/* Article body */}
        <article className="prose-custom">
          {bodyContent.map((section, i) => {
            if (section.type === "heading") {
              return (
                <h2
                  key={i}
                  className="text-2xl font-black text-white mt-10 mb-4"
                  style={{ borderBottom: `2px solid ${catStyle.color}`, paddingBottom: "0.5rem" }}
                >
                  {section.content}
                </h2>
              );
            }
            if (section.type === "quote") {
              return (
                <blockquote
                  key={i}
                  className="my-8 px-6 py-5 rounded-lg"
                  style={{
                    background: catStyle.bg,
                    borderLeft: `4px solid ${catStyle.color}`,
                    boxShadow: catStyle.glow,
                  }}
                >
                  <p className="text-base italic leading-relaxed" style={{ color: catStyle.color }}>
                    {section.content}
                  </p>
                </blockquote>
              );
            }
            if (section.type === "highlight") {
              return (
                <div
                  key={i}
                  className="my-8 px-5 py-4 rounded-lg flex items-start gap-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${catStyle.border}`,
                  }}
                >
                  <BookOpen size={18} className="mt-0.5 flex-shrink-0" style={{ color: catStyle.color }} />
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {section.content}
                  </p>
                </div>
              );
            }
            // paragraph
            return (
              <p
                key={i}
                className="text-base leading-relaxed mb-5"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {section.content}
              </p>
            );
          })}
        </article>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 mb-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share bar */}
        <div
          className="flex flex-wrap items-center gap-3 py-5 mb-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-sm font-semibold text-white/60 mr-2 flex items-center gap-2">
            <Share2 size={14} /> Share
          </span>
          <button
            type="button"
            onClick={shareTwitter}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
            style={{
              background: "rgba(29,161,242,0.12)",
              border: "1px solid rgba(29,161,242,0.3)",
              color: "#1DA1F2",
            }}
            aria-label="Share on X / Twitter"
          >
            <Twitter size={14} /> X / Twitter
          </button>
          <button
            type="button"
            onClick={shareLinkedIn}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
            style={{
              background: "rgba(10,102,194,0.12)",
              border: "1px solid rgba(10,102,194,0.3)",
              color: "#0A66C2",
            }}
            aria-label="Share on LinkedIn"
          >
            <Linkedin size={14} /> LinkedIn
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
            }}
            aria-label="Copy article link"
          >
            <Link2 size={14} /> Copy Link
          </button>
        </div>

        {/* Author bio */}
        {authorBio && (
          <div
            className="flex gap-5 p-6 rounded-xl mb-12"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${catStyle.border}`,
              boxShadow: catStyle.glow,
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
              style={{ background: catStyle.bg, border: `2px solid ${catStyle.color}`, color: catStyle.color }}
            >
              {getInitials(article.author)}
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">{article.author}</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {authorBio}
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard 728×90 – between author bio and comments */}
        <div
          className="w-full flex items-center justify-center mb-10"
          style={{ minHeight: "90px" }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "728px",
              height: "90px",
              border: "1px dashed rgba(255,255,255,0.18)",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              GOOGLE ADSENSE — LEADERBOARD 728×90
            </span>
          </div>
        </div>

        {/* Comments section */}
        <CommentsSection
          lang={lang}
          catColor={catStyle.color}
          catBg={catStyle.bg}
          catBorder={catStyle.border}
        />

        {/* Related articles */}
        {related.length > 0 && (
          <section aria-label="Related articles">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">
                More in{" "}
                <span style={{ color: catStyle.color }}>{article.category}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/article/${rel.id}`}
                  className="group block rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  aria-label={`Read: ${rel.title[lang] || rel.title.en}`}
                >
                  <div className="relative overflow-hidden" style={{ height: "140px" }}>
                    <img
                      src={rel.image}
                      alt={rel.title[lang] || rel.title.en}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 60%)" }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
                      {rel.title[lang] || rel.title.en}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <span className="flex items-center gap-1"><Clock size={10} />{rel.readTime}</span>
                      <span className="flex items-center gap-1"><Eye size={10} />{rel.views}</span>
                    </div>
                    <div
                      className="flex items-center gap-1 mt-3 text-xs font-semibold transition-all"
                      style={{ color: catStyle.color }}
                    >
                      Read Article <ChevronRight size={12} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        </div>{/* end article body */}

        {/* Right: sticky sidebar */}
        <div style={{ position: "sticky", top: "88px" }}>
          <Sidebar lang={lang} />
          <LatestInCategory
            category={article.category}
            currentArticleId={article.id}
            lang={lang}
          />
        </div>
        </div>{/* end grid */}

        <style>{`
          @media (max-width: 960px) {
            .article-detail-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
