import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  image: string;
  publishedAt: string;
  views: number;
}

export default function ArticleDetail() {
  const [_match, params] = useRoute('/articles/:id');
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params?.id]);

  const fetchArticle = async () => {
    try {
      setArticle({
        id: params?.id || '1',
        title: 'AI Breakthroughs in 2026',
        content: '<h2>Introduction</h2><p>AI advances continue...</p>',
        category: 'AI',
        author: 'Tech Writer',
        readTime: '5 min',
        image: 'https://images.unsplash.com/photo-1677442d019cecf8d37846c4827ea62c44f1e0d77?w=1000',
        publishedAt: '2026-06-26',
        views: 1234,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching article:', error);
      setLoading(false);
    }
  };

  if (loading || !article) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="py-12 px-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs text-blue-400 uppercase">{article.category}</span>
          <h1 className="text-5xl font-bold mt-4 mb-6">{article.title}</h1>
          <div className="flex justify-between items-center text-gray-400 text-sm">
            <span>By {article.author}</span>
            <span>{article.readTime}</span>
            <span>{article.views.toLocaleString()} views</span>
          </div>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <img src={article.image} alt={article.title} className="w-full rounded-lg" />
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </section>
    </div>
  );
}
