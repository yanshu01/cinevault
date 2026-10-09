import React, { useEffect, useState } from 'react';
import { fetchTopRecommendations } from '../services/movieStatsService';
import { Flame, Star, ExternalLink, ThumbsUp, Film } from 'lucide-react';

export default function Recommendations({ onNavigateToSwipe }) {
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Fetch specifically the top 10 movies
      const movies = await fetchTopRecommendations(10);
      setTopMovies(movies);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090f] text-slate-200 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
        <p className="text-xs text-slate-400 font-medium">Loading Top 10 Liked Movies...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shadow-lg shadow-amber-400/5">
            <Flame className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Top 10 Most Liked Movies</h1>
            <p className="text-xs text-slate-400">Curated from community right-swipes</p>
          </div>
        </div>

        {onNavigateToSwipe && (
          <button
            onClick={onNavigateToSwipe}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 text-xs font-bold hover:bg-slate-800 transition active:scale-95"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Swipe More</span>
          </button>
        )}
      </header>

      {/* When no movies have been swiped yet */}
      {topMovies.length === 0 ? (
        <div className="bg-[#0e1322] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Film className="w-10 h-10 text-slate-600" />
          <h2 className="text-base font-bold text-white">No liked movies yet</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Start swiping right on movies in Discover mode to populate this leaderboard!
          </p>
          {onNavigateToSwipe && (
            <button
              onClick={onNavigateToSwipe}
              className="mt-2 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl active:scale-95 transition"
            >
              Go to Swiper
            </button>
          )}
        </div>
      ) : (
        /* Top 10 Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topMovies.map((movie, index) => (
            <div
              key={movie.id}
              className="group relative bg-[#0e1322] border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition"
            >
              {/* Poster + Rank Badge */}
              <div className="relative aspect-2/3 overflow-hidden bg-slate-900">
                <span className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border shadow-md ${
                  index === 0
                    ? 'bg-amber-400 text-black border-amber-300'
                    : index === 1
                    ? 'bg-slate-200 text-black border-white'
                    : index === 2
                    ? 'bg-amber-700 text-white border-amber-600'
                    : 'bg-black/70 backdrop-blur-md text-slate-300 border-white/10'
                }`}>
                  #{index + 1}
                </span>

                <img
                  src={movie.poster}
                  alt={movie.title}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Info & Metrics */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-slate-400">
                    <span>{movie.year}</span>
                    <span>•</span>
                    <span className="line-clamp-1">{movie.genre}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="flex items-center text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <ThumbsUp className="w-3 h-3 mr-1 fill-emerald-400" />
                    <span>{movie.likesCount || 0}</span>
                  </span>

                  <div className="flex space-x-1.5">
                    {movie.imdbUrl && (
                      <a
                        href={movie.imdbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400/80 hover:text-amber-300 flex items-center text-[10px] font-semibold"
                      >
                        IMDb <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}