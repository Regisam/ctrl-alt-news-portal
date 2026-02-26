// CTRL + ALT News — Category Page
// Design: Cyberpunk Brutalism | Dark #0A0A0B | Neon Category Colors
// Renders a filtered article listing for AI / SCIENCE / ROBOTICS / GADGETS
// Bilingual: EN / PT-BR

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  gadgetProducts,
  type Category,
  type CategoryArticle,
} from "@/lib/data";

type Lang = "en" | "pt";

interface CategoryPageProps {
  category: Category;
}

const CATEGORY_CONFIG: Record<
  Category,
  {
    color: string;
    bg: string;
    border: string;
    glow: string;
    label: { en: string; pt: string };
    description: { en: string; pt: string };
  }
> = {
  AI: {
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.10)",
    border: "rgba(0,212,255,0.35)",
    glow: "0 0 24px rgba(0,212,255,0.25)",
    label: { en: "Artificial Intelligence", pt: "Inteligência Artificial" },
    description: {
      en: "The latest breakthroughs in machine learning, large language models, neural interfaces, and AI-driven science.",
      pt: "Os últimos avanços em aprendizado de máquina, grandes modelos de linguagem, interfaces neurais e ciência impulsionada por IA.",
    },
  },
  SCIENCE: {
    color: "#A855F7",
    bg: "rgba(168,85,247,0.10)",
    border: "rgba(168,85,247,0.35)",
    glow: "0 0 24px rgba(168,85,247,0.25)",
    label: { en: "Science", pt: "Ciência" },
    description: {
      en: "Discoveries in physics, biology, space exploration, quantum computing, and the frontiers of human knowledge.",
      pt: "Descobertas em física, biologia, exploração espacial, computação quântica e as fronteiras do conhecimento humano.",
    },
  },
  ROBOTICS: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.35)",
    glow: "0 0 24px rgba(239,68,68,0.25)",
    label: { en: "Robotics", pt: "Robótica" },
    description: {
      en: "Humanoid robots, autonomous systems, surgical automation, and the machines reshaping industry and medicine.",
      pt: "Robôs humanoides, sistemas autônomos, automação cirúrgica e as máquinas que estão a reformular a indústria e a medicina.",
    },
  },
  GADGETS: {
    color: "#F97316",
    bg: "rgba(249,115,22,0.10)",
    border: "rgba(249,115,22,0.35)",
    glow: "0 0 24px rgba(249,115,22,0.25)",
    label: { en: "Gadgets", pt: "Gadgets" },
    description: {
      en: "In-depth reviews, benchmark tests, and buying guides for the latest consumer tech, wearables, and devices.",
      pt: "Análises aprofundadas, testes de desempenho e guias de compra para a mais recente tecnologia de consumo, wearables e dispositivos.",
    },
  },
};

const BADGE_COLORS: Record<string, string> = {
  BREAKING: "#EF4444",
  EXCLUSIVE: "#A855F7",
  TRENDING: "#00D4FF",
  HOT: "#F97316",
  FEATURED: "#00D4FF",
  BREAKTHROUGH: "#A855F7",
  VERIFIED: "#22C55E",
  DEVELOPING: "#F97316",
  MILESTONE: "#22C55E",
  INNOVATION: "#A855F7",
};

function ArticleCard({ article, lang, accentColor }: { article: CategoryArticle; lang: Lang; accentColor: string }) {
  const [hovered, setHovered] = useState(false);
  const badgeColor = BADGE_COLORS[article.badge] ?? accentColor;

  return (
    <Link href={`/article/${article.id}`}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${hovered ? accentColor + "55" : "rgba(255,255,255,0.07)"}`,
          borderRadius: "6px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: hovered ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}33` : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={article.image}
            alt={article.title[lang]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
          {/* Badge */}
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: badgeColor,
              color: "#0A0A0B",
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-mono)",
              padding: "3px 8px",
              borderRadius: "3px",
            }}
          >
            {article.badge}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: hovered ? accentColor : "#F0F0F5",
              lineHeight: 1.35,
              margin: 0,
              transition: "color 0.2s",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {article.title[lang]}
          </h2>
          <p
            style={{
              fontSize: "0.82rem",
              color: "rgba(240,240,245,0.55)",
              lineHeight: 1.6,
              margin: 0,
              flex: 1,
            }}
          >
            {article.excerpt[lang]}
          </p>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "0.72rem",
              color: "rgba(240,240,245,0.4)",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
              flexWrap: "wrap",
            }}
          >
            <span>{article.author}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={11} aria-hidden="true" />
              {article.readTime}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Eye size={11} aria-hidden="true" />
              {article.views}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Gadgets card for the GADGETS category page
function GadgetCard({ product, lang, accentColor }: { product: (typeof gadgetProducts)[0]; lang: Lang; accentColor: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={product.amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: "none" }}
    >
      <article
        style={{
          background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${hovered ? accentColor + "55" : "rgba(255,255,255,0.07)"}`,
          borderRadius: "6px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: hovered ? `0 4px 24px rgba(0,0,0,0.4)` : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: accentColor,
              color: "#0A0A0B",
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-mono)",
              padding: "3px 8px",
              borderRadius: "3px",
            }}
          >
            {product.badge}
          </span>
        </div>
        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: hovered ? accentColor : "#F0F0F5",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
          >
            {product.name}
          </h2>
          <p style={{ fontSize: "0.78rem", color: "rgba(240,240,245,0.45)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {product.category}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <span style={{ color: "#F97316", fontSize: "0.8rem" }}>{"★".repeat(Math.round(product.rating))}</span>
            <span style={{ fontSize: "0.72rem", color: "rgba(240,240,245,0.4)", fontFamily: "var(--font-mono)" }}>
              {product.rating} ({product.reviews.toLocaleString()})
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const [lang, setLang] = useState<Lang>("en");
  const cfg = CATEGORY_CONFIG[category];

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [category]);

  const articles =
    category === "AI"
      ? aiArticles
      : category === "SCIENCE"
      ? scienceArticles
      : category === "ROBOTICS"
      ? roboticsArticles
      : [];

  const t = {
    en: { back: "Back to Home", articles: "Latest Articles", noArticles: "More articles coming soon." },
    pt: { back: "Voltar ao Início", articles: "Últimos Artigos", noArticles: "Mais artigos em breve." },
  }[lang];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F0F0F5" }}>
      <Header lang={lang} onLangChange={setLang} />

      {/* Hero Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(10,10,11,0) 60%)`,
          borderBottom: `1px solid ${cfg.border}`,
          padding: "48px 0 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative neon line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
            boxShadow: cfg.glow,
          }}
          aria-hidden="true"
        />
        <div className="container" style={{ maxWidth: "1200px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(240,240,245,0.45)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              textDecoration: "none",
              marginBottom: "20px",
              transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={13} aria-hidden="true" />
            {t.back}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
            <span
              style={{
                background: cfg.color,
                color: "#0A0A0B",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                fontFamily: "var(--font-mono)",
                padding: "4px 10px",
                borderRadius: "3px",
              }}
            >
              {category}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 900,
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#F0F0F5",
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            {cfg.label[lang]}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "rgba(240,240,245,0.55)",
              maxWidth: "600px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {cfg.description[lang]}
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container" style={{ maxWidth: "1200px", padding: "40px 2rem 60px" }}>
        <h2
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            fontFamily: "var(--font-mono)",
            color: cfg.color,
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          {t.articles}
        </h2>

        {category === "GADGETS" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {gadgetProducts.map((p) => (
              <GadgetCard key={p.id} product={p} lang={lang} accentColor={cfg.color} />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} lang={lang} accentColor={cfg.color} />
            ))}
          </div>
        ) : (
          <p style={{ color: "rgba(240,240,245,0.4)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            {t.noArticles}
          </p>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
