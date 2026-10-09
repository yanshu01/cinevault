import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function MovieInspectModal({
  inspectMovie,
  setInspectMovie,
  isInWatchlist,
  watchlist,
  handleUpdateEntry,
  handleRemoveMovie,
  handleSaveMovie
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#0f1426] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded">
              ★ {inspectMovie.imdbRating}
            </span>
            {inspectMovie.rottenTomatoes && inspectMovie.rottenTomatoes !== 'N/A' && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                🍅 {inspectMovie.rottenTomatoes}
              </span>
            )}
          </div>
          <button onClick={() => setInspectMovie(null)} className="p-1 rounded-full bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4">
          <img
            src={inspectMovie.poster}
            alt={inspectMovie.title}
            className="w-24 h-36 object-cover rounded-xl border border-slate-800 shrink-0"
          />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-white">{inspectMovie.title}</h3>
            <p className="text-xs text-slate-400">{inspectMovie.year} • {inspectMovie.runtime}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {inspectMovie.genre?.map(g => (
                <span key={g} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{inspectMovie.plot}</p>

        <div className="text-[11px] bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
          <p><strong className="text-slate-500">Director:</strong> {inspectMovie.director}</p>
          <p><strong className="text-slate-500">Cast:</strong> {inspectMovie.cast}</p>
        </div>

        {isInWatchlist(inspectMovie.id) && (
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Private Note:</label>
            <textarea
              rows={2}
              placeholder="Notes, thoughts, or reminders..."
              value={watchlist.find(m => m.id === inspectMovie.id)?.userNotes || ''}
              onChange={(e) => handleUpdateEntry(inspectMovie.id, 'userNotes', e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <a
            href={`https://www.imdb.com/title/${inspectMovie.id}/`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-amber-400 flex items-center space-x-1 font-bold"
          >
            <span>View on IMDb</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => {
              if (isInWatchlist(inspectMovie.id)) handleRemoveMovie(inspectMovie.id);
              else handleSaveMovie(inspectMovie);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              isInWatchlist(inspectMovie.id)
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-400 text-black hover:bg-amber-300'
            }`}
          >
            {isInWatchlist(inspectMovie.id) ? 'Remove from Album' : 'Add to Album'}
          </button>
        </div>
      </div>
    </div>
  );
}