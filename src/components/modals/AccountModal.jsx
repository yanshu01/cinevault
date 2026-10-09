import React from 'react';
import { User, X, Calendar, Film as MovieIcon, CheckCircle, LogOut } from 'lucide-react';

export default function AccountModal({
  user,
  stats,
  handleLogout,
  setShowAccountModal
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#0f1426] border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center text-white">
          <h3 className="font-extrabold text-base text-amber-400 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Account Profile</span>
          </h3>
          <button onClick={() => setShowAccountModal(false)} className="p-1 rounded-full bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Name</span>
            <p className="text-sm font-semibold text-white">
              {user.displayName || 'Movie Buff'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email Address</span>
            <p className="text-sm font-mono text-slate-300">{user.email}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Last Login</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {user.metadata?.lastSignInTime 
                  ? new Date(user.metadata.lastSignInTime).toLocaleString() 
                  : 'Active Now'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <MovieIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Saved in Album</span>
            </span>
            <span className="text-2xl font-black text-white mt-1">{stats.total}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Already Seen</span>
            </span>
            <span className="text-2xl font-black text-white mt-1">{stats.watched}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of CineVault</span>
        </button>
      </div>
    </div>
  );
}