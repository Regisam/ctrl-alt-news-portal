import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Clock, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import { AuthorFollowButton } from '@/components/AuthorFollowButton';
import {
  aiArticles,
  scienceArticles,
  roboticsArticles,
  type Article,
} from '@/lib/data';

type Lang = 'en' | 'pt';

const AUTHOR_SLUGS: Record<string, string> = {
  'alex-chen': 'Alex Chen',
  'dr-maria-santos': 'Dr. Maria Santos',
  'james-wright': 'James Wright',
  'dr-sarah-kim': 'Dr. Sarah Kim',
  'marcus-lee': 'Marcus Lee',
  'manus-ai': 'Manus AI',
  'dr-elena-vasquez': 'Dr. Elena Vasquez',
  'prof-raj-patel': 'Prof. Raj Patel',
  'dr-yuki-tanaka': 'Dr. Yuki Tanaka',
};

function slugToAuthorName(slug: string): string | null {
  return AUTHOR_SLUGS[slug] || null;
}

function ArticleCard({
  article,
  lang,
  authorColor,
}: {
  article: Article;
  lang: Lang;
  authorColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/article/${article.id}`}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${hovered ? authorColor + '55' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '6px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: hovered ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${authorColor}33` : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
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
    </Link>
  );
}

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<Lang>('en');
  const authorName = slug ? slugToAuthorName(slug) : null;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  if (!authorName) {
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
        <main style={{ flex: 1, padding: '40px 20px', textAlign: 'center' }}>
          <h1>{lang === 'en' ? 'Author not found' : 'Autor não encontrado'}</h1>
          <p style={{ marginBottom: '20px' }}>
            {lang === 'en'
              ? 'The author you are looking for does not exist.'
              : 'O autor que você procura não existe.'}
          </p>
          <Link href="/">
            <a href="/" style={{ color: '#00D4FF', textDecoration: 'underline' }}>
              {lang === 'en' ? 'Back to home' : 'Voltar à página inicial'}
            </a>
          </Link>
        </main>
        <Footer lang={lang} />
      </div>
    );
  }

  const allArticles = [...aiArticles, ...scienceArticles, ...roboticsArticles];
  const authorArticles = allArticles.filter((a) => a.author === authorName);
  const accentColor = '#00D4FF';

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
          <div style={{ position: 'absolute', top: 0, left: 0, height: '2px', width: '60px', background: accentColor }} />

          <Link href="/">
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                marginBottom: '20px',
                fontSize: '0.875rem',
              }}
            >
              <ArrowLeft size={16} /> {lang === 'en' ? 'Back' : 'Voltar'}
            </a>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {authorName}
              </h1>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                {lang === 'en'
                  ? `${authorArticles.length} articles published`
                  : `${authorArticles.length} artigos publicados`}
              </p>
            </div>
            <AuthorFollowButton authorName={authorName} variant="full" />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: 0 }}>
            {lang === 'en'
              ? 'Explore all articles written by this author. Follow to get recommendations tailored to their work.'
              : 'Explore todos os artigos escritos por este autor. Siga para obter recomendações personalizadas sobre seu trabalho.'}
          </p>
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Articles Grid */}
          <div>
            {authorArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.6)' }}>
                <p>
                  {lang === 'en'
                    ? 'No articles found from this author.'
                    : 'Nenhum artigo encontrado deste autor.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {authorArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} lang={lang} authorColor={accentColor} />
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
