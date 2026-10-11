import { useState, useEffect, useMemo } from 'react';
import { 
  db, 
  isDemoFirebase, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../firebase';
import { DEFAULT_ALBUMS } from '../data/preloadedMovies';

export function useWatchlist(user, triggerToast, setApiKey) {
  const [watchlist, setWatchlist] = useState([]);
  const [shelves, setShelves] = useState(DEFAULT_ALBUMS || ['Weekend Binge', 'Favorites']);
  const [syncStatus, setSyncStatus] = useState('connecting');

  useEffect(() => {
    if (!user) {
      const guestSaved = localStorage.getItem('cinevault_guest_watchlist');
      if (guestSaved) setWatchlist(JSON.parse(guestSaved));
      setSyncStatus('synced');
      return;
    }

    if (isDemoFirebase || !db) {
      const saved = localStorage.getItem(`cinevault_${user.uid}_watchlist`);
      if (saved) setWatchlist(JSON.parse(saved));
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('connecting');
    const moviesRef = collection(db, 'users', user.uid, 'movies');
    const unsubMovies = onSnapshot(moviesRef, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ ...d.data(), id: d.id }));
      setWatchlist(items);
      setSyncStatus('synced');
    }, () => setSyncStatus('synced'));

    const settingsRef = collection(db, 'users', user.uid, 'settings');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      snap.forEach(d => {
        if (d.id === 'user_shelves' && Array.isArray(d.data()?.list)) setShelves(d.data().list);
        if (d.id === 'api_settings' && d.data()?.omdbApiKey && setApiKey) setApiKey(d.data().omdbApiKey);
      });
    }, () => {});

    return () => {
      unsubMovies();
      unsubSettings();
    };
  }, [user, setApiKey]);

  const handleSaveMovie = async (movie, shelf = 'Weekend Binge') => {
    const targetShelf = shelf === 'All' ? 'Weekend Binge' : (shelf || 'Weekend Binge');
    const payload = {
      id: movie.id,
      title: movie.title || 'Untitled',
      year: movie.year || '2025',
      genre: Array.isArray(movie.genre) ? movie.genre : [movie.genre || 'Cinema'],
      director: movie.director || 'N/A',
      cast: movie.cast || 'N/A',
      plot: movie.plot || '',
      poster: movie.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
      imdbRating: movie.imdbRating || movie.rating || '7.5',
      rottenTomatoes: movie.rottenTomatoes || '85%',
      origin: movie.origin || movie.industry || 'Bollywood',
      runtime: movie.runtime || '120 min',
      status: movie.status || 'Want to Watch',
      shelf: targetShelf,
      userRating: movie.userRating || 0,
      userNotes: movie.userNotes || '',
      dateAdded: new Date().toISOString()
    };

    if (!user || isDemoFirebase || !db) {
      const storageKey = user ? `cinevault_${user.uid}_watchlist` : 'cinevault_guest_watchlist';
      setWatchlist(prev => {
        const next = prev.some(m => m.id === movie.id)
          ? prev.map(m => m.id === movie.id ? { ...m, ...payload } : m)
          : [...prev, payload];
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      triggerToast(`Added to ${targetShelf}`);
      return;
    }

    setSyncStatus('saving');
    try {
      await setDoc(doc(db, 'users', user.uid, 'movies', movie.id), payload, { merge: true });
      setSyncStatus('synced');
      triggerToast(`Added to ${targetShelf}`);
    } catch {
      setSyncStatus('error');
    }
  };

  const handleUpdateEntry = async (movieId, field, value) => {
    if (!user || isDemoFirebase || !db) {
      const storageKey = user ? `cinevault_${user.uid}_watchlist` : 'cinevault_guest_watchlist';
      setWatchlist(prev => {
        const next = prev.map(m => m.id === movieId ? { ...m, [field]: value } : m);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      return;
    }
    setSyncStatus('saving');
    try {
      await setDoc(doc(db, 'users', user.uid, 'movies', movieId), { [field]: value }, { merge: true });
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  };

  const handleRemoveMovie = async (movieId) => {
    if (!user || isDemoFirebase || !db) {
      const storageKey = user ? `cinevault_${user.uid}_watchlist` : 'cinevault_guest_watchlist';
      setWatchlist(prev => {
        const next = prev.filter(m => m.id !== movieId);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      triggerToast('Removed from album');
      return;
    }
    setSyncStatus('saving');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'movies', movieId));
      setSyncStatus('synced');
      triggerToast('Removed from album');
    } catch {
      setSyncStatus('error');
    }
  };

  const handleAddShelf = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || shelves.includes(trimmed)) return;
    const updated = [...shelves, trimmed];
    setShelves(updated);
    triggerToast(`Created "${trimmed}"`);
    if (user && !isDemoFirebase && db) {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'user_shelves'), { list: updated });
    }
    return trimmed;
  };

  const isInWatchlist = (id) => watchlist.some(m => m.id === id);

  const stats = useMemo(() => {
    return {
      total: watchlist.length,
      watched: watchlist.filter(m => m.status === 'Watched').length
    };
  }, [watchlist]);

  return {
    watchlist,
    shelves,
    syncStatus,
    stats,
    handleSaveMovie,
    handleUpdateEntry,
    handleRemoveMovie,
    handleAddShelf,
    isInWatchlist
  };
}