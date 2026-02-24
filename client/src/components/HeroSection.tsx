// CTRL + ALT News — Hero Section
// Design: Cinematic full-width hero with gradient overlay
// Left: Bold headline + excerpt + CTA | Right: Cinematic image
// Dark text-on-image with gradient-to-dark for legibility

import { Clock, Eye, ArrowRight } from "lucide-react";
import { HERO_IMAGE } from "@/lib/data";
import { toast } from "sonner";

interface HeroSectionProps {
  lang: 'en' | 'pt';
}

const content = {
  en: {
    category: "AI × SCIENCE",
    headline: "THE QUANTUM REVOLUTION: How AI is Reshaping Science",
    excerpt: "A new class of hybrid quantum-AI systems is breaking the boundaries of what's computationally possible — redefining drug discovery, climate modelling, and the very nature of intelligence itself.",
    author: "Dr. Elena Vasquez",
    date: "Feb 24, 2026",
    readTime: "8 min read",
    views: "124.5K views",
    cta: "Continue Reading",
    breaking: "BREAKING",
  },
  pt: {
    category: "IA × CIÊNCIA",
    headline: "A REVOLUÇÃO QUÂNTICA: Como a IA Está Reformulando a Ciência",
    excerpt: "Uma nova classe de sistemas híbridos quântico-IA está quebrando os limites do que é computacionalmente possível — redefinindo a descoberta de medicamentos, a modelagem climática e a própria natureza da inteligência.",
    author: "Dra. Elena Vasquez",
    date: "24 Fev 2026",
    readTime: "8 min de leitura",
    views: "124,5K visualizações",
    cta: "Continuar Lendo",
    breaking: "URGENTE",
  }
};

export default function HeroSection({ lang }: HeroSectionProps) {
  const t = content[lang];

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '560px',
        overflow: 'hidden',
        background: '#0A0A0B',
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.55)',
        }}
      />

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,11,0.97) 0%, rgba(10,10,11,0.85) 45%, rgba(10,10,11,0.4) 75%, rgba(10,10,11,0.15) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 40%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '56px 2rem 56px 2rem',
          maxWidth: '780px',
        }}
      >
        {/* Breaking + Category Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span
            style={{
              background: 'oklch(0.62 0.26 25)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              padding: '3px 8px',
              borderRadius: '2px',
              fontFamily: "'Roboto Mono', monospace",
              boxShadow: '0 0 10px oklch(0.62 0.26 25 / 0.5)',
            }}
          >
            {t.breaking}
          </span>
          <span
            style={{
              color: 'oklch(0.78 0.18 195)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: "'Roboto Mono', monospace",
              textShadow: '0 0 8px oklch(0.78 0.18 195 / 0.5)',
            }}
          >
            {t.category}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="fade-in-up"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            lineHeight: 1.1,
            color: '#FFFFFF',
            marginBottom: '20px',
            maxWidth: '650px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            letterSpacing: '-0.01em',
          }}
        >
          {t.headline}
        </h1>

        {/* Excerpt */}
        <p
          className="fade-in-up fade-in-up-delay-1"
          style={{
            color: 'rgba(240,240,245,0.75)',
            fontSize: '1rem',
            lineHeight: 1.65,
            marginBottom: '28px',
            maxWidth: '560px',
            fontWeight: 400,
          }}
        >
          {t.excerpt}
        </p>

        {/* Meta */}
        <div
          className="fade-in-up fade-in-up-delay-2"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, oklch(0.78 0.18 195), oklch(0.65 0.28 300))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              EV
            </div>
            <span style={{ color: 'rgba(240,240,245,0.8)', fontSize: '0.82rem', fontWeight: 600 }}>
              {t.author}
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>·</span>
          <span style={{ color: 'rgba(240,240,245,0.5)', fontSize: '0.78rem', fontFamily: "'Roboto Mono', monospace" }}>
            {t.date}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(240,240,245,0.5)' }}>
            <Clock size={12} />
            <span style={{ fontSize: '0.78rem', fontFamily: "'Roboto Mono', monospace" }}>{t.readTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(240,240,245,0.5)' }}>
            <Eye size={12} />
            <span style={{ fontSize: '0.78rem', fontFamily: "'Roboto Mono', monospace" }}>{t.views}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="fade-in-up fade-in-up-delay-3"
          onClick={() => toast.info("Article coming soon!", { duration: 2000 })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'oklch(0.78 0.18 195)',
            color: '#0A0A0B',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 20px oklch(0.78 0.18 195 / 0.4)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'oklch(0.85 0.18 195)';
            e.currentTarget.style.boxShadow = '0 0 30px oklch(0.78 0.18 195 / 0.7)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'oklch(0.78 0.18 195)';
            e.currentTarget.style.boxShadow = '0 0 20px oklch(0.78 0.18 195 / 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {t.cta}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
