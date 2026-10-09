import React from 'react';
import { Key, X } from 'lucide-react';

export default function ApiKeyModal({
  apiKey,
  setApiKey,
  setShowKeyModal,
  triggerToast
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#11162a] border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-white">
          <h3 className="font-bold text-sm flex items-center space-x-1.5 text-amber-400">
            <Key className="w-4 h-4" />
            <span>IMDb / OMDb API Key</span>
          </h3>
          <button onClick={() => setShowKeyModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <p className="text-[11px] text-slate-300">
          Get your free API key at{" "}
          <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer" className="text-amber-400 underline">
            omdbapi.com
          </a>{" "}
          to search online movies directly.
        </p>

        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value.trim())}
          placeholder="e.g. 1a2b3c4d"
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
        />

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={() => {
              setApiKey('');
              localStorage.removeItem('omdb_api_key');
              setShowKeyModal(false);
            }}
            className="px-3 py-1.5 text-xs text-slate-400"
          >
            Clear
          </button>
          <button
            onClick={() => {
              localStorage.setItem('omdb_api_key', apiKey);
              setShowKeyModal(false);
              triggerToast('API Key Saved');
            }}
            className="px-4 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}