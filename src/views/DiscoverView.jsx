import React, { useState } from 'react';
import { Search, Sparkles, LayoutGrid } from 'lucide-react';
import MovieSwipeDiscovery from '../components/MovieSwipeDiscovery.jsx';
import DiscoverMovieCard from '../components/cards/DiscoverMovieCard.jsx';

export default function DiscoverView({
  searchQuery,
  onSearchChange,
  apiKey,
  apiSearching,
  combinedMovies,
  selectedOrigin,
  setSelectedOrigin,
  isInWatchlist,
  onSaveMovie,
  onRemoveMovie,
  onInspectMovie
}) {
  const [discoverMode, setDiscoverMode] = useState('swipe');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search 'Dhurandhar', 'Jawan', 'Dune'..."
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm shadow-sm"
          />
          {apiKey && apiSearching && (
            <span className="absolute right-3 top-3 text-[11px] text-amber-400 font-semibold animate-pulse">
              Searching...
            </span>
          )}
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setDiscoverMode('swipe')}
            className={`p-2 rounded-lg transition ${
              discoverMode === 'swipe' 
                ? 'bg-amber-400 text-black shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Film Match (Swipe Deck)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDiscoverMode('grid')}
            className={`p-2 rounded-lg transition ${
              discoverMode === 'grid' 
                ? 'bg-amber-400 text-black shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {discoverMode === 'swipe' ? (
        <div className="pt-2">
          <MovieSwipeDiscovery 
            movies={combinedMovies}
            onSaveToWatchlist={onSaveMovie}
            onInspectMovie={onInspectMovie}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {['All', 'Bollywood', 'Hollywood', 'British', 'Canadian'].map((origin) => (
              <button
                key={origin}
                onClick={() => setSelectedOrigin(origin)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition active:scale-95 ${
                  selectedOrigin === origin 
                    ? 'bg-amber-400 text-black font-bold shadow' 
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {origin}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            {combinedMovies.map((movie) => (
              <DiscoverMovieCard
                key={movie.id}
                movie={movie}
                isSaved={isInWatchlist(movie.id)}
                onInspect={onInspectMovie}
                onSave={onSaveMovie}
                onRemove={onRemoveMovie}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}