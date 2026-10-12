import React from 'react';
import { Star, ExternalLink, Bookmark, Plus } from 'lucide-react';

export default function DiscoverMovieCard({ movie, isSaved, onInspect, onSave, onRemove }) {
  return (
    <div className="bg-[#0f1324] rounded-xl border border-slate-800/80 p-3.5 flex gap-3.5 items-center justify-between shadow-md">
      <img
        src={movie.poster}
        alt={movie.title}
        onClick={() => onInspect(movie)}
        className="w-20 h-28 object-cover rounded-lg shrink-0 cursor-pointer border border-slate-800"
      />

      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div>
          <div className="flex items-center justify-between">
            <h3 
              onClick={() => onInspect(movie)}
              className="font-bold text-white text-sm truncate cursor-pointer hover:text-amber-400"
            >
              {movie.title}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-1">{movie.year}</span>
          </div>

          <div className="flex items-center space-x-1.5 mt-1">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20 font-bold flex items-center space-x-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>{movie.imdbRating}</span>
            </span>
            {movie.rottenTomatoes && movie.rottenTomatoes !== 'N/A' && (
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/20 font-semibold">
                🍅 {movie.rottenTomatoes}
              </span>
            )}
            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded">
              {movie.origin}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1.5">
            {movie.plot}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
          <a
            href={`https://www.imdb.com/title/${movie.id}/`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-0.5 font-medium"
          >
            <span>IMDb</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => isSaved ? onRemove(movie.id) : onSave(movie)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95 ${
              isSaved 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-amber-400 text-black hover:bg-amber-300'
            }`}
          >
            {isSaved ? (
              <>
                <Bookmark className="w-3 h-3 fill-rose-300" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}