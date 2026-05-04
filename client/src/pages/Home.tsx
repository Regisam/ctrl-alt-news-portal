// CTRL + ALT News — Home Page
// Design: Cyberpunk Brutalism | Dark Mode | Neon Category System
// Layout: Header → AdBanner(728x90) → Hero+Sidebar → AdBanner(728x90) → Trending → Gadgets → Footer
// Bilingual: EN / PT-BR

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { PersonalizedFeed } from "@/components/PersonalizedFeed";
import TrendingSection from "@/components/TrendingSection";
import GadgetsSection from "@/components/GadgetsSection";
import ArticlesSection from "@/components/ArticlesSection";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useTrending } from "@/hooks/useTrending";
import { useABTest } from "@/hooks/useABTest";
import { feedLayoutExperiment } from "@/lib/ab-experiments";
import { trendingArticles } from "@/lib/data";

type Lang = 'en' | 'pt';

export default function Home() {
   const [lang, setLang] = useState<Lang>('en');
  const [location] = useLocation();

  // Personalized feed hooks
  const { favoriteCategories } = useUserPreferences();
  const { history } = useReadingHistory();
  const { trending } = useTrending({ count: 8, maxCount: 10 });
  const readArticleIds = history.map((h) => Number(h.articleId));

  // A/B test variant (Story 11.8 - dynamic from experiment)
  const feedLayoutVariant = useABTest(feedLayoutExperiment);
  const abVariant: 'personalized' | 'chronological' = (feedLayoutVariant as 'personalized' | 'chronological') || 'personalized';

  // Sync <html lang> with selected language for screen readers and SEO
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  // Handle hash-based scroll when navigating from other pages (e.g. /#section-ai)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace('#', '');
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };
    tryScroll();
  }, [location]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#F0F0F5' }}>
      {/* ---- HEADER ---- */}
      <Header lang={lang} onLangChange={setLang} />

      {/* ---- AD BANNER TOP (728x90 Leaderboard) — above Hero ---- */}
      <div style={{ background: 'rgba(5,5,6,0.95)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AdBanner marginTop="0" marginBottom="0" />
        </div>
      </div>

      {/* ---- HERO + SIDEBAR ---- */}
      <div
        style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '0', alignItems: 'start' }}
        className="hero-layout"
      >
        {/* Hero */}
        <div>
          <HeroSection lang={lang} />
        </div>

        {/* Sidebar */}
        <div
          style={{
            padding: '24px 0 24px 24px',
            position: 'sticky',
            top: '64px',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          <Sidebar lang={lang} />
        </div>
      </div>

      {/* ---- AD BANNER BOTTOM (728x90 Leaderboard) — below Hero, above Personalized Feed ---- */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        <AdBanner />
      </div>

      {/* ---- PERSONALIZED FEED ("For You") — Story 11.6 ---- */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        <PersonalizedFeed
          allArticles={trendingArticles}
          userPreferences={favoriteCategories}
          trendingArticles={trending}
          readArticleIds={readArticleIds}
          lang={lang}
          maxItems={8}
          abVariant={abVariant}
        />
      </div>

      {/* ---- TRENDING NEWS ---- */}
      <TrendingSection lang={lang} />

      {/* ---- AI / SCIENCE / ROBOTICS ARTICLES ---- */}
      <ArticlesSection lang={lang} />

      {/* ---- GADGETS REVIEWS ---- */}
      <GadgetsSection lang={lang} />

      {/* ---- FOOTER ---- */}
      <Footer lang={lang} />

      {/* ---- Responsive Styles ---- */}
      <style>{`
        @media (max-width: 900px) {
          .hero-layout {
            grid-template-columns: 1fr !important;
          }
          .hero-layout > div:last-child {
            padding: 16px !important;
            position: static !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}
