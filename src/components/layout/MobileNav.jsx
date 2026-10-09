import React from 'react';
import { Search, Bookmark, FolderPlus, User } from 'lucide-react';

export default function MobileNav({
  activeTab,
  setActiveTab,
  watchlistLength,
  setShowNewShelfModal,
  setShowAccountModal
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0b0e1a]/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-2 px-4 md:hidden">
      <button
        onClick={() => setActiveTab('discover')}
        className={`flex flex-col items-center space-y-1 ${activeTab === 'discover' ? 'text-amber-400' : 'text-slate-400'}`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-medium">Discover</span>
      </button>

      <button
        onClick={() => setActiveTab('watchlist')}
        className={`flex flex-col items-center space-y-1 relative ${activeTab === 'watchlist' ? 'text-amber-400' : 'text-slate-400'}`}
      >
        <Bookmark className="w-5 h-5" />
        <span className="text-[10px] font-medium">My Albums</span>
        {watchlistLength > 0 && (
          <span className="absolute -top-1 -right-2 bg-amber-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
            {watchlistLength}
          </span>
        )}
      </button>

      <button
        onClick={() => setShowNewShelfModal(true)}
        className="flex flex-col items-center space-y-1 text-slate-400 hover:text-white"
      >
        <FolderPlus className="w-5 h-5 text-indigo-400" />
        <span className="text-[10px] font-medium">+ Album</span>
      </button>

      <button
        onClick={() => setShowAccountModal(true)}
        className="flex flex-col items-center space-y-1 text-slate-400 hover:text-amber-400"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Account</span>
      </button>
    </nav>
  );
}