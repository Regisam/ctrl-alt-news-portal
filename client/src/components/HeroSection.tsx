// CTRL + ALT News — Hero Section
// Design: Cinematic full-width hero with gradient overlay
// Left: Bold headline + excerpt + CTA | Right: Cinematic image
// A11y: article semantics, aria-label on bg, button type, focus-visible

import { Clock, Eye, ArrowRight } from "lucide-react";
import { HERO_IMAGE } from "@/lib/data";
import { Link } from "wouter";

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
    bgAlt: "Futuristic quantum computing laboratory with AI neural network visualizations in deep blue and cyan",
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
    bgAlt: "Laboratório de computação quântica futurista com visualizações de redes neurais de IA em azul e ciano",
  }
};

export default function HeroSection({ lang }: HeroSectionProps) {
  const t = content[lang];

  return (
    <section
      aria-label={lang === 'en' ? "Featured article" : "Artigo em destaque"}
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
        role="img"
        aria-label={t.bgAlt}
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
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,11,0.97) 0%, rgba(10,10,11,0.85) 45%, rgba(10,10,11,0.4) 75%, rgba(10,10,11,0.15) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 40%)',
        }}
      />

      {/* Content */}
      <article
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
            aria-label={t.breaking}
            style={{
              background: 'var(--color-neon-robotics)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              padding: '3px 8px',
              borderRadius: '2px',
              fontFamily: "var(--font-mono)",
              boxShadow: '0 0 10px oklch(0.62 0.26 25 / 0.5)',
            }}
          >
            {t.breaking}
          </span>
          <span
            style={{
              color: 'var(--color-neon-ai)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: "var(--font-mono)",
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
            fontFamily: "var(--font-body)",
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
              aria-hidden="true"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-neon-ai), var(--color-neon-science))',
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
          <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>·</span>
          <time
            dateTime="2026-02-24"
            style={{ color: 'rgba(240,240,245,0.5)', fontSize: '0.78rem', fontFamily: "var(--font-mono)" }}
          >
            {t.date}
          </time>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(240,240,245,0.5)' }}>
            <Clock size={12} aria-hidden="true" />
            <span style={{ fontSize: '0.78rem', fontFamily: "var(--font-mono)" }}>{t.readTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(240,240,245,0.5)' }}>
            <Eye size={12} aria-hidden="true" />
            <span style={{ fontSize: '0.78rem', fontFamily: "var(--font-mono)" }}>{t.views}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/article/101"
          className="fade-in-up fade-in-up-delay-3 focus-neon hero-cta-btn"
          aria-label={lang === 'en' ? "Continue reading: The Quantum Revolution" : "Continuar lendo: A Revolução Quântica"}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-neon-ai)',
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
            fontFamily: "var(--font-body)",
            textDecoration: 'none',
          }}
        >
          {t.cta}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </article>
    </section>
  );
}
