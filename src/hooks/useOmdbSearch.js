import { useState, useRef, useMemo } from 'react';
import { PRELOADED_MOVIES } from '../data/preloadedMovies';

export function useOmdbSearch(apiKey) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [apiSearching, setApiSearching] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const searchDebounceRef = useRef(null);

  const handleLiveSearch = async (text) => {
    if (!apiKey || !text.trim() || text.length < 2) {
      setApiResults([]);
      return;
    }
    setApiSearching(true);
    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(text)}&type=movie`);
      const data = await res.json();
      if (data.Response === 'True') {
        const detailed = await Promise.all(
          data.Search.slice(0, 6).map(async (m) => {
            const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${m.imdbID}`);
            const d = await detailRes.json();
            const rt = d.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || "N/A";
            return {
              id: d.imdbID,
              title: d.Title,
              year: d.Year,
              genre: d.Genre ? d.Genre.split(', ') : ['Cinema'],
              director: d.Director || 'N/A',
              cast: d.Actors || 'N/A',
              plot: d.Plot !== 'N/A' ? d.Plot : 'No description available.',
              poster: d.Poster !== 'N/A' ? d.Poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
              imdbRating: d.imdbRating !== 'N/A' ? d.imdbRating : '7.5',
              rottenTomatoes: rt,
              origin: d.Country?.includes("India") ? "Bollywood" : d.Country?.includes("UK") ? "British" : d.Country?.includes("Canada") ? "Canadian" : "Hollywood",
              runtime: d.Runtime || "120 min"
            };
          })
        );
        setApiResults(detailed.filter(Boolean));
      } else {
        setApiResults([]);
      }
    } catch {
      setApiResults([]);
    } finally {
      setApiSearching(false);
    }
  };

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (apiKey) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => handleLiveSearch(val), 350);
    }
  };

  const combinedMovies = useMemo(() => {
    const pool = apiResults.length > 0 ? apiResults : (PRELOADED_MOVIES || []);
    return pool.filter(movie => {
      const matchQuery = !searchQuery || 
        movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.cast?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOrigin = selectedOrigin === 'All' || movie.origin === selectedOrigin;
      return matchQuery && matchOrigin;
    });
  }, [searchQuery, selectedOrigin, apiResults]);

  return {
    searchQuery,
    selectedOrigin,
    setSelectedOrigin,
    apiSearching,
    onSearchChange,
    combinedMovies
  };
}