import { useRoute } from 'wouter';
import { useState, useEffect } from 'react';

const CATEGORIES = ['AI', 'Science', 'Robotics', 'Gadgets'];

export default function CategoryPage() {
  const [_match, params] = useRoute('/category/:name');
  const [articles, setArticles] = useState([]);
  const category = params?.name?.toUpperCase() || 'AI';

  useEffect(() => {
    setArticles([
      { id: '1', title: `${category} Article 1`, views: 1200, readTime: '5 min' },
      { id: '2', title: `${category} Article 2`, views: 890, readTime: '7 min' },
    ]);
  }, [category]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-12">{category}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <a
              key={article.id}
              href={`/articles/${article.id}`}
              className="border border-gray-800 rounded-lg p-4 hover:border-blue-500 transition"
            >
              <h3 className="font-bold text-lg">{article.title}</h3>
              <div className="text-gray-400 text-sm mt-4 flex justify-between">
                <span>{article.views} views</span>
                <span>{article.readTime}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
