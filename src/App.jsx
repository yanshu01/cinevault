import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Check, 
  RefreshCw, 
  Search, 
  Star, 
  ExternalLink, 
  Bookmark, 
  Plus, 
  Trash2 
} from 'lucide-react';

import { 
  auth, 
  db, 
  isDemoFirebase, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from './firebase';

import { PRELOADED_MOVIES, DEFAULT_ALBUMS } from './data/preloadedMovies';

import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import AuthScreen from './components/modals/AuthScreen';
import AccountModal from './components/modals/AccountModal';
import MovieInspectModal from './components/modals/MovieInspectModal';
import ApiKeyModal from './components/modals/ApiKeyModal';
import NewShelfModal from './components/modals/NewShelfModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'watchlist'

  // Watchlist & Shelves
  const [watchlist, setWatchlist] = useState([]);
  const [shelves, setShelves] = useState(DEFAULT_ALBUMS);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [selectedShelf, setSelectedShelf] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dateAdded');

  // OMDb API Key
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('omdb_api_key') || import.meta.env.VITE_OMDB_API_KEY || '';
  });
  const [apiSearching, setApiSearching] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const searchDebounceRef = useRef(null);

  // Modals & Feedback
  const [inspectMovie, setInspectMovie] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showNewShelfModal, setShowNewShelfModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Standalone Auth Screen Form States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Auth State Listener
  useEffect(() => {
    if (isDemoFirebase || !auth) {
      const cached = localStorage.getItem('cinevault_demo_session');
      if (cached) {
        setUser(JSON.parse(cached));
      }
      setAuthChecking(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return () => unsub();
  }, []);

  // Firestore Sync Listener
  useEffect(() => {
    if (!user) return;

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
        if (d.id === 'api_settings' && d.data()?.omdbApiKey) setApiKey(d.data().omdbApiKey);
      });
    }, () => {});

    return () => {
      unsubMovies();
      unsubSettings();
    };
  }, [user]);

  const triggerToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (isDemoFirebase || !auth) {
      const simulatedUser = {
        uid: 'user_' + Date.now(),
        email: authEmail,
        displayName: authMode === 'signup' ? authName : 'Movie Enthusiast',
        metadata: {
          lastSignInTime: new Date().toUTCString(),
          creationTime: new Date().toUTCString()
        }
      };
      localStorage.setItem('cinevault_demo_session', JSON.stringify(simulatedUser));
      setUser(simulatedUser);
      setAuthLoading(false);
      triggerToast('Welcome to CineVault!');
      return;
    }

    try {
      if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName.trim()) {
          await updateProfile(cred.user, { displayName: authName.trim() });
        }
        await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'info'), {
          name: authName.trim() || 'Movie Lover',
          email: authEmail,
          createdAt: new Date().toISOString()
        }, { merge: true });
        triggerToast('Account created!');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        triggerToast('Welcome back!');
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isDemoFirebase || !auth) {
      localStorage.removeItem('cinevault_demo_session');
      setUser(null);
      setShowAccountModal(false);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setWatchlist([]);
      setShowAccountModal(false);
      triggerToast('Signed out');
    } catch (err) {
      console.error(err);
    }
  };

  // Movie Actions
  const handleSaveMovie = async (movie, shelf = 'Weekend Binge') => {
    if (!user) return;
    const targetShelf = shelf === 'All' ? 'Weekend Binge' : (shelf || 'Weekend Binge');
    const payload = {
      id: movie.id,
      title: movie.title || 'Untitled',
      year: movie.year || '2025',
      genre: movie.genre || ['Cinema'],
      director: movie.director || 'N/A',
      cast: movie.cast || 'N/A',
      plot: movie.plot || '',
      poster: movie.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
      imdbRating: movie.imdbRating || '7.5',
      rottenTomatoes: movie.rottenTomatoes || '85%',
      origin: movie.origin || 'Bollywood',
      runtime: movie.runtime || '120 min',
      status: movie.status || 'Want to Watch',
      shelf: targetShelf,
      userRating: movie.userRating || 0,
      userNotes: movie.userNotes || '',
      dateAdded: new Date().toISOString()
    };

    if (isDemoFirebase || !db) {
      setWatchlist(prev => {
        const next = prev.some(m => m.id === movie.id)
          ? prev.map(m => m.id === movie.id ? { ...m, ...payload } : m)
          : [...prev, payload];
        localStorage.setItem(`cinevault_${user.uid}_watchlist`, JSON.stringify(next));
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
    if (!user) return;
    if (isDemoFirebase || !db) {
      setWatchlist(prev => {
        const next = prev.map(m => m.id === movieId ? { ...m, [field]: value } : m);
        localStorage.setItem(`cinevault_${user.uid}_watchlist`, JSON.stringify(next));
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
    if (!user) return;
    if (isDemoFirebase || !db) {
      setWatchlist(prev => {
        const next = prev.filter(m => m.id !== movieId);
        localStorage.setItem(`cinevault_${user.uid}_watchlist`, JSON.stringify(next));
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

  const handleAddShelf = async (e) => {
    e.preventDefault();
    if (!newShelfName.trim() || !user) return;
    const name = newShelfName.trim();
    if (!shelves.includes(name)) {
      const updated = [...shelves, name];
      setShelves(updated);
      setSelectedShelf(name);
      triggerToast(`Created "${name}"`);
      if (!isDemoFirebase && db) {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'user_shelves'), { list: updated });
      }
    }
    setNewShelfName('');
    setShowNewShelfModal(false);
  };

  // Live OMDb Search
  const handleLiveSearch = async (text) => {
    if (!apiKey || !text.trim() || text.length < 2) {
      setApiResults([]);
      return;
    }
    setApiSearching(true);
    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(text)}&type=movie`);
      const data = await res.json();
      if (data.Response === 'True') {
        const detailed = await Promise.all(
          data.Search.slice(0, 6).map(async (m) => {
            const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${m.imdbID}`);
            const d = await detailRes.json();
            const rt = d.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || "N/A";
            return {
              id: d.imdbID,
              title: d.Title,
              year: d.Year,
              genre: d.Genre ? d.Genre.split(', ') : ['Cinema'],
              director: d.Director || 'N/A',
              cast: d.Actors || 'N/A',
              plot: d.Plot !== 'N/A' ? d.Plot : 'No description available.',
              poster: d.Poster !== 'N/A' ? d.Poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
              imdbRating: d.imdbRating !== 'N/A' ? d.imdbRating : '7.5',
              rottenTomatoes: rt,
              origin: d.Country?.includes("India") ? "Bollywood" : d.Country?.includes("UK") ? "British" : d.Country?.includes("Canada") ? "Canadian" : "Hollywood",
              runtime: d.Runtime || "120 min"
            };
          })
        );
        setApiResults(detailed.filter(Boolean));
      } else {
        setApiResults([]);
      }
    } catch {
      setApiResults([]);
    } finally {
      setApiSearching(false);
    }
  };

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (apiKey) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => handleLiveSearch(val), 350);
    }
  };

  const combinedMovies = useMemo(() => {
    const pool = apiResults.length > 0 ? apiResults : PRELOADED_MOVIES;
    return pool.filter(movie => {
      const matchQuery = !searchQuery || 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.cast?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOrigin = selectedOrigin === 'All' || movie.origin === selectedOrigin;
      return matchQuery && matchOrigin;
    });
  }, [searchQuery, selectedOrigin, apiResults]);

  const sortedAndFilteredAlbum = useMemo(() => {
    let list = watchlist.filter(movie => {
      const matchShelf = selectedShelf === 'All' || movie.shelf === selectedShelf;
      const matchStatus = statusFilter === 'All' || movie.status === statusFilter;
      return matchShelf && matchStatus;
    });

    if (sortBy === 'imdb') list.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0));
    else if (sortBy === 'rating') list.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
    else list.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

    return list;
  }, [watchlist, selectedShelf, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = watchlist.length;
    const watched = watchlist.filter(m => m.status === 'Watched').length;
    return { total, watched };
  }, [watchlist]);

  const isInWatchlist = (id) => watchlist.some(m => m.id === id);

  // ---------------- Loading Gate ----------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#07090f] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  // ---------------- GATEKEEPER: LOGIN / SIGNUP SCREEN ----------------
  if (!user) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        authLoading={authLoading}
        handleAuthSubmit={handleAuthSubmit}
      />
    );
  }

  // ---------------- MAIN APPLICATION (AUTHENTICATED) ----------------
  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 font-sans pb-24 md:pb-10 selection:bg-amber-500 selection:text-black">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 stroke-3" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistLength={watchlist.length}
        setShowNewShelfModal={setShowNewShelfModal}
        syncStatus={syncStatus}
        setShowAccountModal={setShowAccountModal}
        setShowKeyModal={setShowKeyModal}
        apiKey={apiKey}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5">
        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search 'Dhurandhar', 'Jawan', 'Dune'..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm shadow-sm"
              />
              {apiKey && apiSearching && (
                <span className="absolute right-3 top-3 text-[11px] text-amber-400 font-semibold animate-pulse">
                  Searching...
                </span>
              )}
            </div>

            {/* Region Scroll Filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['All', 'Bollywood', 'Hollywood', 'British', 'Canadian'].map((origin) => (
                <button
                  key={origin}
                  onClick={() => setSelectedOrigin(origin)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition active:scale-95 ${
                    selectedOrigin === origin 
                      ? 'bg-amber-400 text-black font-bold shadow' 
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {origin}
                </button>
              ))}
            </div>

            {/* Movies List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {combinedMovies.map((movie) => {
                const saved = isInWatchlist(movie.id);
                return (
                  <div
                    key={movie.id}
                    className="bg-[#0f1324] rounded-xl border border-slate-800/80 p-3.5 flex gap-3.5 items-center justify-between shadow-md"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      onClick={() => setInspectMovie(movie)}
                      className="w-20 h-28 object-cover rounded-lg shrink-0 cursor-pointer border border-slate-800"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 
                            onClick={() => setInspectMovie(movie)}
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
                          onClick={() => saved ? handleRemoveMovie(movie.id) : handleSaveMovie(movie)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95 ${
                            saved 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : 'bg-amber-400 text-black hover:bg-amber-300'
                          }`}
                        >
                          {saved ? (
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
              })}
            </div>
          </div>
        )}

        {/* WATCHLIST / ALBUMS TAB */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['All', ...shelves].map((shelf) => {
                const count = shelf === 'All' ? watchlist.length : watchlist.filter(m => m.shelf === shelf).length;
                return (
                  <button
                    key={shelf}
                    onClick={() => setSelectedShelf(shelf)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition active:scale-95 flex items-center space-x-1 ${
                      selectedShelf === shelf 
                        ? 'bg-amber-400 text-black font-bold shadow' 
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{shelf}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Filter and Sort bar */}
            <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1">
                {['All', 'Want', 'Watching', 'Watched'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st === 'Want' ? 'Want to Watch' : st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                      (statusFilter === st || (st === 'Want' && statusFilter === 'Want to Watch'))
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300 text-[11px] focus:outline-none"
              >
                <option value="dateAdded">Recent</option>
                <option value="imdb">IMDb</option>
                <option value="rating">My Rating</option>
              </select>
            </div>

            {/* Watchlist Items */}
            {sortedAndFilteredAlbum.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-300 font-semibold">No movies found in this album.</p>
                <p className="text-xs text-slate-500">Add titles from the Discover tab to build this shelf!</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold shadow"
                >
                  Discover Movies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sortedAndFilteredAlbum.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-[#0f1324] rounded-xl border border-slate-800/80 p-3.5 flex flex-col gap-2.5 shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        onClick={() => setInspectMovie(movie)}
                        className="w-16 h-22 object-cover rounded-lg shrink-0 cursor-pointer border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 
                            onClick={() => setInspectMovie(movie)}
                            className="font-bold text-white text-sm truncate cursor-pointer hover:text-amber-400"
                          >
                            {movie.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono ml-1">{movie.year}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                            ★ {movie.imdbRating}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {movie.runtime}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-[10px] text-slate-500">Album:</span>
                          <select
                            value={movie.shelf || 'Weekend Binge'}
                            onChange={(e) => handleUpdateEntry(movie.id, 'shelf', e.target.value)}
                            className="bg-slate-950 text-amber-300 text-[11px] px-2 py-0.5 rounded border border-slate-800"
                          >
                            {shelves.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <select
                        value={movie.status}
                        onChange={(e) => handleUpdateEntry(movie.id, 'status', e.target.value)}
                        className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${
                          movie.status === 'Watched' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : movie.status === 'Watching'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <option value="Want to Watch">Want to Watch</option>
                        <option value="Watching">Watching</option>
                        <option value="Watched">Watched</option>
                      </select>

                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleUpdateEntry(movie.id, 'userRating', movie.userRating === star ? 0 : star)}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                star <= movie.userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={`https://www.imdb.com/title/${movie.id}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-amber-400"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleRemoveMovie(movie.id)}
                          className="p-1 text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistLength={watchlist.length}
        setShowNewShelfModal={setShowNewShelfModal}
        setShowAccountModal={setShowAccountModal}
      />

      {/* Account Details Modal */}
      {showAccountModal && (
        <AccountModal
          user={user}
          stats={stats}
          handleLogout={handleLogout}
          setShowAccountModal={setShowAccountModal}
        />
      )}

      {/* Movie Details Modal */}
      {inspectMovie && (
        <MovieInspectModal
          inspectMovie={inspectMovie}
          setInspectMovie={setInspectMovie}
          isInWatchlist={isInWatchlist}
          watchlist={watchlist}
          handleUpdateEntry={handleUpdateEntry}
          handleRemoveMovie={handleRemoveMovie}
          handleSaveMovie={handleSaveMovie}
        />
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          setShowKeyModal={setShowKeyModal}
          triggerToast={triggerToast}
        />
      )}

      {/* New Shelf Modal */}
      {showNewShelfModal && (
        <NewShelfModal
          newShelfName={newShelfName}
          setNewShelfName={setNewShelfName}
          setShowNewShelfModal={setShowNewShelfModal}
          handleAddShelf={handleAddShelf}
        />
      )}
    </div>
  );
}