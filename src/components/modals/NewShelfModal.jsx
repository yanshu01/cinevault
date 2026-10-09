import React from 'react';
import { FolderPlus, X } from 'lucide-react';

export default function NewShelfModal({
  newShelfName,
  setNewShelfName,
  setShowNewShelfModal,
  handleAddShelf
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <form onSubmit={handleAddShelf} className="w-full max-w-sm bg-[#11162a] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center text-white">
          <h3 className="font-bold text-sm text-amber-400 flex items-center space-x-1.5">
            <FolderPlus className="w-4 h-4" />
            <span>New Movie Album</span>
          </h3>
          <button type="button" onClick={() => setShowNewShelfModal(false)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <input
          type="text"
          value={newShelfName}
          onChange={(e) => setNewShelfName(e.target.value)}
          placeholder="e.g. Friday Thrillers, Classics..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
          autoFocus
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowNewShelfModal(false)}
            className="px-3 py-1.5 text-xs text-slate-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newShelfName.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}