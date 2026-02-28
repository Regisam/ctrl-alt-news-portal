// CTRL + ALT News — Articles Section (AI / Science / Robotics)
// Design: Cyberpunk Brutalism | Dark Mode | Neon Category System
// Layout: Three 4×2 carousels with prev/next navigation and dot indicators
// Bilingual: EN / PT-BR

import ArticleCarousel from "@/components/ArticleCarousel";
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
} from "@/lib/data";

type Lang = "en" | "pt";

interface ArticlesSectionProps {
  lang: Lang;
}

export default function ArticlesSection({ lang }: ArticlesSectionProps) {
  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "48px 2rem 0",
      }}
    >
      {/* 🤖 AI Carousel */}
      <ArticleCarousel
        lang={lang}
        articles={aiArticles}
        categoryLabel="Artificial Intelligence"
        accentColor="var(--color-neon-ai)"
        accentColorRgb="0, 212, 200"
        badgeBg="rgba(0,212,200,0.85)"
        sectionIcon="🤖"
        sectionId="section-ai"
        categoryPath="/ai"
      />

      {/* 🔬 Science Carousel */}
      <ArticleCarousel
        lang={lang}
        articles={scienceArticles}
        categoryLabel="Science"
        accentColor="var(--color-neon-science)"
        accentColorRgb="168, 85, 247"
        badgeBg="rgba(168,85,247,0.85)"
        sectionIcon="🔬"
        sectionId="section-science"
        categoryPath="/science"
      />

      {/* ⚙️ Robotics Carousel */}
      <ArticleCarousel
        lang={lang}
        articles={roboticsArticles}
        categoryLabel="Robotics"
        accentColor="var(--color-neon-robotics)"
        accentColorRgb="239, 68, 68"
        badgeBg="rgba(239,68,68,0.85)"
        sectionIcon="⚙️"
        sectionId="section-robotics"
        categoryPath="/robotics"
      />

      <style>{`
        .carousel-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          border-color: rgba(255,255,255,0.14) !important;
        }
        .carousel-card:focus-visible {
          outline: 2px solid rgba(255,255,255,0.5);
          outline-offset: 2px;
        }
        .carousel-card:hover .carousel-card-img {
          transform: scale(1.06);
        }
        .carousel-view-all-btn:hover { opacity: 0.75; }
        @media (max-width: 1100px) {
          .carousel-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .carousel-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .carousel-card, .carousel-card-img { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
