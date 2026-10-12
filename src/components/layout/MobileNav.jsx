import React from 'react';
import { Flame, Bookmark, FolderPlus, User } from 'lucide-react';

export default function MobileNav({
  activeTab,
  setActiveTab,
  watchlistLength,
  setShowNewShelfModal,
  setShowAccountModal,
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0b0e1a]/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-2 px-4 md:hidden">
      {/* 1. Community Top Recommendations */}
      <button
        type="button"
        onClick={() => setActiveTab('recommendations')}
        className={`flex flex-col items-center space-y-1 transition active:scale-95 ${
          activeTab === 'recommendations' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px] font-medium">Recom</span>
      </button>

      {/* 2. My Albums / Watchlist */}
      <button
        type="button"
        onClick={() => setActiveTab('watchlist')}
        className={`flex flex-col items-center space-y-1 relative transition active:scale-95 ${
          activeTab === 'watchlist' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Bookmark className="w-5 h-5" />
        <span className="text-[10px] font-medium">My Albums</span>
        {watchlistLength > 0 && (
          <span className="absolute -top-1 -right-2 bg-amber-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
            {watchlistLength}
          </span>
        )}
      </button>

      {/* 3. Add Shelf Modal */}
      <button
        type="button"
        onClick={() => setShowNewShelfModal(true)}
        className="flex flex-col items-center space-y-1 text-slate-400 hover:text-white transition active:scale-95"
      >
        <FolderPlus className="w-5 h-5 text-indigo-400" />
        <span className="text-[10px] font-medium">+ Album</span>
      </button>

      {/* 4. Account Modal */}
      <button
        type="button"
        onClick={() => setShowAccountModal(true)}
        className="flex flex-col items-center space-y-1 text-slate-400 hover:text-amber-400 transition active:scale-95"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Account</span>
      </button>
    </nav>
  );
}