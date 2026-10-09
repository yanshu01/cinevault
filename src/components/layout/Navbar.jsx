import React from 'react';
import { Film, Search, Bookmark, FolderPlus, Cloud, RefreshCw, AlertCircle, User, Key } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  watchlistLength,
  setShowNewShelfModal,
  syncStatus,
  setShowAccountModal,
  setShowKeyModal,
  apiKey
}) {
  return (
    <header className="sticky top-0 z-40 bg-[#0c101d]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('discover')}>
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Film className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-base bg-linear-to-r from-amber-200 to-rose-200 bg-clip-text text-transparent">
              CineVault
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
              IMDb
            </span>
          </div>
        </div>

        {/* Desktop Central Navigation (Discover & My Albums) */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
              activeTab === 'discover'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
              activeTab === 'watchlist'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>My Albums</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'watchlist' ? 'bg-black text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {watchlistLength}
            </span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Desktop "+ Album" Action Button */}
          <button
            onClick={() => setShowNewShelfModal(true)}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Album</span>
          </button>

          {/* Cloud Sync State */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
            {syncStatus === 'synced' ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium hidden sm:inline">Cloud</span>
              </>
            ) : syncStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-400 hidden sm:inline">Syncing</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400 hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Account Details Button */}
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-300 transition"
            title="Account Details"
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`p-1.5 rounded-lg border transition ${
              apiKey ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-slate-800 text-slate-400'
            }`}
            title="API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}