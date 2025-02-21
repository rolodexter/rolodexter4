import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import type { SearchResult } from '../types';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  // Add any props if needed
}

export default function SearchResults(props: Props) {
  const router = useRouter();
  const { q: query } = router.query;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleResults, setVisibleResults] = useState<boolean[]>([]);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.toString())}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data: SearchResult[] = await response.json();
        setResults(data);
        setVisibleResults(new Array(data.length).fill(false));
        
        // Animate results in sequence
        data.forEach((_: SearchResult, index: number) => {
          setTimeout(() => {
            setVisibleResults(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * 100); // 100ms delay between each result
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <main className="search-results bg-[#111111] relative">
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="w-full max-w-3xl mx-auto px-8 md:px-12 py-12">
        <div className="space-y-2 text-center mb-12">
          <p className="text-sm font-extralight text-gray-400 tracking-wide">
            {results.length} results for
          </p>
          <h1 className="text-2xl font-extralight text-gray-300">
            "{query}"
          </h1>
        </div>
        
        {!query ? (
          <div className="text-center">
            <p className="text-lg font-extralight text-gray-500">Enter your search query</p>
          </div>
        ) : loading ? (
          <div className="w-full animate-pulse space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/20 h-16 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-lg font-extralight text-gray-500">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center">
            <p className="text-lg font-extralight text-gray-500">No results found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.map((result, idx) => (
              <Link
                key={idx}
                href={result.path}
                className={`block terminal-line ${visibleResults[idx] ? 'visible' : ''}`}
              >
                <article 
                  className="px-8 py-6 -mx-8 rounded-lg transition-all duration-200 hover:bg-white/[0.01] text-left"
                >
                  <div 
                    className="text-xl font-extralight text-gray-300 group-hover:text-gray-200"
                  >
                    {result.title}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <Link href="/" className="block cursor-pointer">
          <div className="logo-container w-16 h-16">
            <div>
              <Image
                src="/assets/branding/logos/SQUARE_LOGO.jpg"
                alt="Rolodexter Logo"
                width={100}
                height={100}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}