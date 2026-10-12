import React, { useEffect, useState, useRef } from 'react';
import { fetchTopRecommendations } from '../services/movieStatsService';
import { 
  Flame, 
  Search, 
  Star, 
  ExternalLink, 
  Bookmark, 
  Check, 
  Film, 
  X, 
  Loader2 
} from 'lucide-react';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

export default function Recommendations({ 
  onNavigateToSwipe, 
  onSaveToWatchlist,
  isInWatchlist,
  apiKey 
}) {
  const [topMovies, setTopMovies] = useState([]);
  const [loadingTopMovies, setLoadingTopMovies] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState('imdb'); // 'imdb' | 'rotten'
  const debounceTimerRef = useRef(null);

  const activeApiKey = apiKey || localStorage.getItem('omdb_api_key') || import.meta.env.VITE_OMDB_API_KEY || '';

  // Load Top 10 Community Movies on mount
  useEffect(() => {
    async function loadData() {
      try {
        const movies = await fetchTopRecommendations(10);
        setTopMovies(movies || []);
      } catch (err) {
        console.error('Failed to load top recommendations:', err);
      } finally {
        setLoadingTopMovies(false);
      }
    }
    loadData();
  }, []);

  // Fetch movies from OMDb API
  const handleLiveSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (!activeApiKey) {
      const localMatches = topMovies.filter((m) =>
        m.title?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(localMatches);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${activeApiKey}&s=${encodeURIComponent(query)}&type=movie`
      );
      const data = await res.json();

      if (data.Response === 'True') {
        const detailed = await Promise.all(
          data.Search.slice(0, 10).map(async (m) => {
            const detailRes = await fetch(
              `https://www.omdbapi.com/?apikey=${activeApiKey}&i=${m.imdbID}`
            );
            const d = await detailRes.json();
            const rtRating =
              d.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';

            return {
              id: d.imdbID || m.imdbID,
              title: d.Title || m.Title || 'Untitled',
              year: d.Year || m.Year || '2025',
              genre: d.Genre ? d.Genre.split(', ') : ['Cinema'],
              director: d.Director || 'N/A',
              cast: d.Actors || 'N/A',
              plot: d.Plot && d.Plot !== 'N/A' ? d.Plot : 'No description available.',
              poster: d.Poster && d.Poster !== 'N/A' ? d.Poster : FALLBACK_POSTER,
              imdbRating: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : '7.5',
              rottenTomatoes: rtRating,
              origin: d.Country?.includes('India') ? 'Bollywood' : 'Hollywood',
              runtime: d.Runtime || '120 min',
              imdbUrl: `https://www.imdb.com/title/${d.imdbID || m.imdbID}/`,
              rtUrl: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(d.Title || m.Title)}`
            };
          })
        );
        setSearchResults(detailed.filter(Boolean));
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleLiveSearch(val);
    }, 350);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = (movie) => {
    if (!onSaveToWatchlist) return;

    // Normalize movie object to ensure it has valid fields for Firestore/localStorage
    const normalizedMovie = {
      id: movie.id || `movie_${Date.now()}`,
      title: movie.title || 'Untitled',
      year: movie.year || '2025',
      genre: Array.isArray(movie.genre) ? movie.genre : [movie.genre || 'Cinema'],
      director: movie.director || 'N/A',
      cast: movie.cast || 'N/A',
      plot: movie.plot || '',
      poster: movie.poster && movie.poster !== 'N/A' ? movie.poster : FALLBACK_POSTER,
      imdbRating: movie.imdbRating || '7.5',
      rottenTomatoes: movie.rottenTomatoes || 'N/A',
      origin: movie.origin || 'Bollywood',
      runtime: movie.runtime || '120 min'
    };

    onSaveToWatchlist(normalizedMovie);
  };

  const isSearchActive = searchQuery.trim().length > 0;
  const displayedMovies = isSearchActive ? searchResults : topMovies;

  if (loadingTopMovies) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 p-4 sm:p-6 max-w-6xl mx-auto space-y-7">
      
      {/* 1. TOP SEARCH BAR */}
      <div className="bg-[#0e1322] border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchInputChange}
            placeholder={
              searchSource === 'imdb'
                ? "Search movies by title (e.g. 'Dune', '3 Idiots', 'Inception')..."
                : "Search Rotten Tomatoes ratings (e.g. 'Oppenheimer', 'RRR')..."
            }
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
          />

          <div className="absolute right-3 top-2.5 flex items-center space-x-2">
            {isSearching && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECTION HEADER */}
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          
          
        </div>

        {/* Back / Reset button */}
        <div className="flex items-center space-x-2">
  {isSearchActive && (
    <button
      type="button"
      onClick={handleClear}
      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white transition"
    >
      Back to Top 10
    </button>
  )}
</div>
      </header>

      {/* 3. MAIN CARDS GRID */}
      {displayedMovies.length === 0 ? (
        <div className="bg-[#0e1322] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Film className="w-10 h-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">
            {isSearchActive ? 'No movies found' : 'No liked movies yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {isSearchActive
              ? 'Try searching with another title or switch database providers.'
              : 'Start swiping right in discover mode to build the community leaderboard!'}
          </p>
          {isSearchActive && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl active:scale-95 transition"
            >
              Show Top 10
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedMovies.map((movie, index) => {
            const isSaved = isInWatchlist ? isInWatchlist(movie.id) : false;
            const genreText = Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Cinema';
            const externalUrl = searchSource === 'rotten' && movie.rtUrl ? movie.rtUrl : (movie.imdbUrl || `https://www.imdb.com/title/${movie.id}/`);

            return (
              <div
                key={movie.id || index}
                className="group relative bg-[#0e1322] border border-slate-800/90 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition shadow-lg"
              >
                {/* Poster & Badges */}
                <div className="relative aspect-2/3 overflow-hidden bg-slate-900">
                  {!isSearchActive ? (
                    <span
                      className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border shadow-md ${
                        index === 0
                          ? 'bg-amber-400 text-black border-amber-300'
                          : index === 1
                          ? 'bg-slate-200 text-black border-white'
                          : index === 2
                          ? 'bg-amber-700 text-white border-amber-600'
                          : 'bg-black/70 backdrop-blur-md text-slate-300 border-white/10'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 backdrop-blur-md text-amber-400 border border-white/10">
                      ★ {movie.imdbRating || 'N/A'}
                    </span>
                  )}

                  <img
                    src={movie.poster || FALLBACK_POSTER}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_POSTER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Details & Action Button */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1" title={movie.title}>
                      {movie.title}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-slate-400">
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span className="line-clamp-1 truncate">{genreText}</span>
                    </div>
                  </div>

                  {/* Card Footer: Add to Album button + External Link */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleSave(movie)}
                      disabled={isSaved}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition active:scale-95 ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow'
                      }`}
                      title={isSaved ? 'In your album' : 'Add to My Album'}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3 h-3 stroke-3" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3 stroke-[2.2]" />
                          <span>+ Album</span>
                        </>
                      )}
                    </button>

                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-amber-400 flex items-center space-x-0.5 text-[10px] font-medium transition"
                      title="View details"
                    >
                      <span>{searchSource === 'rotten' ? 'RT' : 'IMDb'}</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}