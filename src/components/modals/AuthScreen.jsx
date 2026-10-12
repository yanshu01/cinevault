import React from 'react';
import { X, Film } from 'lucide-react';

export default function AuthScreen({
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  authLoading,
  handleAuthSubmit,
  onBack,
  onClose
}) {
  const handleDismiss = onBack || onClose;

  return (
    // Fixed modal overlay covers the entire screen on top of the page
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      {/* Centered Modal Card */}
      <div className="relative w-full max-w-sm bg-[#0d111d] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Close / Back Button */}
        {handleDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header / Logo */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">CineVault</h2>
          <p className="text-xs text-slate-400">
            Create your movie albums & track cinema in real-time.
          </p>
        </div>

        {/* Tab Toggle (Sign In / Sign Up) */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'login'
                ? 'bg-amber-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'signup'
                ? 'bg-amber-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notice */}
        {authError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {authError}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Email Address:
            </label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Password:
            </label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-2.5 mt-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow transition active:scale-[0.99] disabled:opacity-50"
          >
            {authLoading
              ? 'Connecting...'
              : authMode === 'signup'
              ? 'Create Account'
              : 'Sign In & Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}