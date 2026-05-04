import { useState, useMemo } from 'react';
import { TrendingUp, Clock, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import { useTrending } from '@/hooks/useTrending';
import { aiArticles, scienceArticles, roboticsArticles, type Article } from '@/lib/data';

type Lang = 'en' | 'pt';

function ArticleCard({
  article,
  lang,
  rank,
}: {
  article: Article;
  lang: Lang;
  rank: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/article/${article.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${hovered ? 'rgba(0,212,255,0.55)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '6px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: hovered ? '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,255,0.33)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(0,212,255,0.9)',
              color: '#0A0A0B',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <TrendingUp size={12} /> #{rank}
          </div>
          <img
            src={article.image}
            alt={article.title[lang]}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
          />
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <h3
            style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: '1.3',
              margin: 0,
            }}
          >
            {article.title[lang]}
          </h3>

          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.875rem',
              lineHeight: '1.4',
              margin: 0,
              flex: 1,
            }}
          >
            {article.excerpt[lang]}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: 'auto',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {article.readTime}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} /> {article.views}
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}

export default function TrendingDashboard() {
  const [lang, setLang] = useState<Lang>('en');
  const { trending } = useTrending({ count: 10 });

  const trendingArticles = useMemo(() => {
    return trending || [];
  }, [trending]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#0A0A0B',
        color: '#fff',
      }}
    >
      <Header lang={lang} onLangChange={setLang} />

      <main style={{ flex: 1, padding: '40px 20px' }}>
        {/* Hero Banner */}
        <div
          style={{
            position: 'relative',
            marginBottom: '40px',
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '8px',
            padding: '40px',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, height: '2px', width: '60px', background: '#00D4FF' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <TrendingUp size={40} style={{ color: '#00D4FF' }} />
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {lang === 'en' ? 'Trending Now' : 'Em Alta Agora'}
              </h1>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                {lang === 'en'
                  ? 'Most engaging articles trending across the platform'
                  : 'Os artigos mais envolventes em alta na plataforma'}
              </p>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: 0 }}>
            {lang === 'en'
              ? 'Discover articles that are captivating readers based on reactions, bookmarks, and shares.'
              : 'Descubra artigos que estão conquistando leitores com base em reações, marcadores e compartilhamentos.'}
          </p>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Trending Articles */}
          <div>
            {trendingArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.6)' }}>
                <p>
                  {lang === 'en'
                    ? 'No trending articles found. Check back soon!'
                    : 'Nenhum artigo em alta encontrado. Volte em breve!'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {trendingArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} lang={lang} rank={index + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar lang={lang} />
        </div>
      </main>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 900px) {
          main {
            display: grid;
            gridTemplateColumns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}
