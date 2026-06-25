import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/search/articles?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.data?.articles || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-gray-900 text-white px-4 py-3 rounded border border-gray-800 focus:border-blue-500 outline-none"
          />
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">Search</button>
        </form>

        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((result: any) => (
              <a
                key={result.id}
                href={`/articles/${result.id}`}
                className="block border border-gray-800 rounded p-4 hover:border-blue-500 transition"
              >
                <h3 className="font-bold text-lg">{result.title}</h3>
                <p className="text-gray-400 mt-2">{result.excerpt}</p>
              </a>
            ))
          ) : (
            <p className="text-gray-400">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}
