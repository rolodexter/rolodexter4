import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
  rank: number;
}

export default function SearchResults() {
  const router = useRouter();
  const { q: query } = router.query;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError('Failed to fetch search results');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Search Results for "{query}"
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Found {results.length} results
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No results found for your search.</p>
          </div>
        )}

        <div className="space-y-6">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                <Link
                  href={`/api/document/${encodeURIComponent(result.path.replace(/^\//, ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  {result.title}
                </Link>
              </h2>
              <p className="text-gray-600 text-sm mb-2">{result.path}</p>
              {result.excerpt && (
                <p className="text-gray-700 mt-2">{result.excerpt}</p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                Relevance score: {Math.round(result.rank * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 