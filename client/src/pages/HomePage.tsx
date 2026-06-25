import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: string;
  image: string;
  publishedAt: string;
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/analytics-live/live');
      const data = await response.json();
      
      // Mock articles for now
      setArticles([
        {
          id: '1',
          title: 'AI Breakthroughs in 2026',
          excerpt: 'Latest advances in artificial intelligence',
          category: 'AI',
          author: 'Tech Writer',
          readTime: '5 min',
          image: 'https://images.unsplash.com/photo-1677442d019cecf8d37846c4827ea62c44f1e0d77?w=500',
          publishedAt: '2026-06-26',
        },
        {
          id: '2',
          title: 'Quantum Computing Progress',
          excerpt: 'New quantum computer achieves major milestone',
          category: 'Science',
          author: 'Science Correspondent',
          readTime: '7 min',
          image: 'https://images.unsplash.com/photo-1635070041078-e3fb3fe6e5d0?w=500',
          publishedAt: '2026-06-25',
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-16 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">CTRL + ALT NEWS</h1>
          <p className="text-xl text-gray-400">Your source for AI, Science, Robotics, and Gadgets</p>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <a
                key={article.id}
                href={`/articles/${article.id}`}
                className="group border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover group-hover:opacity-75 transition"
                />
                <div className="p-4">
                  <span className="text-xs text-blue-400 uppercase">{article.category}</span>
                  <h3 className="text-lg font-bold mt-2 group-hover:text-blue-400 transition">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-2">{article.excerpt}</p>
                  <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                    <span>{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
