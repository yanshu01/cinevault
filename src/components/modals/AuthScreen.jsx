import React from 'react';
import { Film, AlertCircle, User, Mail, Lock, RefreshCw } from 'lucide-react';

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
  handleAuthSubmit
}) {
  return (
    <div className="fixed inset-0 h-dvh w-screen overflow-hidden overscroll-none touch-none bg-[#07090f] text-slate-100 flex flex-col  items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-amber-500/20 mx-auto">
            <Film className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-linear-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
            CineVault
          </h1>
          <p className="text-xs text-slate-400">
            Create your movie albums & track cinema in real-time.
          </p>
        </div>

        <div className="bg-[#0f1426] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg transition ${authMode === 'login' ? 'bg-amber-400 text-black shadow' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-lg transition ${authMode === 'signup' ? 'bg-amber-400 text-black shadow' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Your Full Name:</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Email Address:</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Password:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition shadow-lg shadow-amber-500/10 disabled:opacity-50 mt-2 flex items-center justify-center space-x-1.5"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <span>{authMode === 'login' ? 'Sign In & Enter' : 'Create Free Account'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}