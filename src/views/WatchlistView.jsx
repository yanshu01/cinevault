import React, { useState, useMemo } from 'react';
import { Bookmark, Star, ExternalLink, Trash2 } from 'lucide-react';

export default function WatchlistView({
  watchlist,
  shelves,
  onUpdateEntry,
  onRemoveMovie,
  onInspectMovie,
  onGoToDiscover
}) {
  const [selectedShelf, setSelectedShelf] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dateAdded');

  const sortedAndFilteredAlbum = useMemo(() => {
    let list = watchlist.filter(movie => {
      const matchShelf = selectedShelf === 'All' || movie.shelf === selectedShelf;
      const matchStatus = statusFilter === 'All' || movie.status === statusFilter;
      return matchShelf && matchStatus;
    });

    if (sortBy === 'imdb') list.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
    else if (sortBy === 'rating') list.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
    else list.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

    return list;
  }, [watchlist, selectedShelf, statusFilter, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {['All', ...shelves].map((shelf) => {
          const count = shelf === 'All' ? watchlist.length : watchlist.filter(m => m.shelf === shelf).length;
          return (
            <button
              key={shelf}
              onClick={() => setSelectedShelf(shelf)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition active:scale-95 flex items-center space-x-1 ${
                selectedShelf === shelf 
                  ? 'bg-amber-400 text-black font-bold shadow' 
                  : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{shelf}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-1">
          {['All', 'Want', 'Watching', 'Watched'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st === 'Want' ? 'Want to Watch' : st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                (statusFilter === st || (st === 'Want' && statusFilter === 'Want to Watch'))
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300 text-[11px] focus:outline-none"
        >
          <option value="dateAdded">Recent</option>
          <option value="imdb">IMDb</option>
          <option value="rating">My Rating</option>
        </select>
      </div>

      {sortedAndFilteredAlbum.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">No movies found in this album.</p>
          <p className="text-xs text-slate-500">Add titles from the Discover tab to build this shelf!</p>
          <button
            onClick={onGoToDiscover}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold shadow"
          >
            Discover Movies
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedAndFilteredAlbum.map((movie) => (
            <div
              key={movie.id}
              className="bg-[#0f1324] rounded-xl border border-slate-800/80 p-3.5 flex flex-col gap-2.5 shadow-md"
            >
              <div className="flex items-start gap-3">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  onClick={() => onInspectMovie(movie)}
                  className="w-16 h-22 object-cover rounded-lg shrink-0 cursor-pointer border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 
                      onClick={() => onInspectMovie(movie)}
                      className="font-bold text-white text-sm truncate cursor-pointer hover:text-amber-400"
                    >
                      {movie.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono ml-1">{movie.year}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                      ★ {movie.imdbRating}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {movie.runtime}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">Album:</span>
                    <select
                      value={movie.shelf || 'Weekend Binge'}
                      onChange={(e) => onUpdateEntry(movie.id, 'shelf', e.target.value)}
                      className="bg-slate-950 text-amber-300 text-[11px] px-2 py-0.5 rounded border border-slate-800"
                    >
                      {shelves.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <select
                  value={movie.status}
                  onChange={(e) => onUpdateEntry(movie.id, 'status', e.target.value)}
                  className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${
                    movie.status === 'Watched' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : movie.status === 'Watching'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <option value="Want to Watch">Want to Watch</option>
                  <option value="Watching">Watching</option>
                  <option value="Watched">Watched</option>
                </select>

                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onUpdateEntry(movie.id, 'userRating', movie.userRating === star ? 0 : star)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= movie.userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`https://www.imdb.com/title/${movie.id}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-amber-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onRemoveMovie(movie.id)}
                    className="p-1 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}