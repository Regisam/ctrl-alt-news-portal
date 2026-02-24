// CTRL + ALT News — Home Page
// Design: Cyberpunk Brutalism | Dark Mode | Neon Category System
// Layout: Header → AdBanner → Hero+Sidebar → Trending → Gadgets → Footer
// Bilingual: EN / PT-BR

import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TrendingSection from "@/components/TrendingSection";
import GadgetsSection from "@/components/GadgetsSection";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

type Lang = 'en' | 'pt';

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#F0F0F5' }}>
      {/* ---- HEADER ---- */}
      <Header lang={lang} onLangChange={setLang} />

      {/* ---- AD BANNER (728x90 Leaderboard) ---- */}
      <div style={{ background: 'rgba(5,5,6,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            className="ad-placeholder"
            style={{
              height: '64px',
              borderRadius: '4px',
              maxWidth: '728px',
              margin: '0 auto',
            }}
          >
            <span>Google AdSense — Leaderboard 728×90</span>
          </div>
        </div>
      </div>

      {/* ---- HERO + SIDEBAR ---- */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '0', alignItems: 'start' }} className="hero-layout">
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

      {/* ---- TRENDING NEWS ---- */}
      <TrendingSection lang={lang} />

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
