import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Film, Bookmark, Star, ExternalLink, Plus, Trash2, 
  CheckCircle, Clock, Heart, Filter, FolderPlus, Key, AlertCircle, 
  Eye, Play, X, SlidersHorizontal, Cloud, RefreshCw, ArrowUpDown, 
  Flame, Check, LogIn, LogOut, User, Mail, Lock, Calendar, Film as MovieIcon
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// ---------------- Firebase Configuration ----------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cinevault-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cinevault-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cinevault-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

const isDemoFirebase = firebaseConfig.apiKey === "demo-api-key";

let app, auth, db;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase local fallback mode active:", e);
}

const PRELOADED_MOVIES = [
  {
    id: "tt2995365",
    title: "Dhurandhar",
    year: "2025",
    genre: ["Action", "Thriller", "Crime"],
    director: "Aditya Dhar",
    cast: "Ranveer Singh, Sanjay Dutt, R. Madhavan, Akshaye Khanna, Arjun Rampal",
    plot: "A high-stakes covert operative mission based on real-world geopolitics and intense intelligence operations.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
    imdbRating: "8.4",
    rottenTomatoes: "89%",
    origin: "Bollywood",
    runtime: "165 min"
  },
  {
    id: "tt15398776",
    title: "Oppenheimer",
    year: "2023",
    genre: ["Biography", "Drama", "History"],
    director: "Christopher Nolan",
    cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
    plot: "The story of American scientist J. Robert Oppenheimer and his role in the Manhattan Project.",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80",
    imdbRating: "8.9",
    rottenTomatoes: "93%",
    origin: "Hollywood",
    runtime: "180 min"
  },
  {
    id: "tt1160419",
    title: "Dune: Part Two",
    year: "2024",
    genre: ["Action", "Adventure", "Sci-Fi"],
    director: "Denis Villeneuve",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem",
    plot: "Paul Atreides unites with Chani and the Fremen while seeking revenge against conspirators.",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    imdbRating: "8.6",
    rottenTomatoes: "92%",
    origin: "Canadian",
    runtime: "166 min"
  },
  {
    id: "tt15354916",
    title: "Jawan",
    year: "2023",
    genre: ["Action", "Thriller"],
    director: "Atlee",
    cast: "Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone",
    plot: "A high-octane action thriller of a prison warden committed to rectifying the evils in society.",
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80",
    imdbRating: "7.0",
    rottenTomatoes: "88%",
    origin: "Bollywood",
    runtime: "169 min"
  },
  {
    id: "tt0816692",
    title: "Interstellar",
    year: "2014",
    genre: ["Adventure", "Drama", "Sci-Fi"],
    director: "Christopher Nolan",
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
    plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    imdbRating: "8.7",
    rottenTomatoes: "73%",
    origin: "British",
    runtime: "169 min"
  }
];

const DEFAULT_ALBUMS = ['Weekend Binge', 'Masterpieces', 'Must Watch', 'Action Blast'];

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
      <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-amber-500/20 mx-auto">
              <Film className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
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

  // ---------------- MAIN APPLICATION (AUTHENTICATED) ----------------
  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 font-sans pb-24 md:pb-10 selection:bg-amber-500 selection:text-black">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c101d]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('discover')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Film className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base bg-gradient-to-r from-amber-200 to-rose-200 bg-clip-text text-transparent">
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
                {watchlist.length}
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

      {/* Mobile Bottom Navigation (Shown only on small screens) */}
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
          {watchlist.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-amber-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
              {watchlist.length}
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

      {/* ---------------- ACCOUNT DETAILS MODAL ---------------- */}
      {showAccountModal && (
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
      )}

      {/* Movie Details Modal */}
      {inspectMovie && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-[#0f1426] border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded">
                  ★ {inspectMovie.imdbRating}
                </span>
                {inspectMovie.rottenTomatoes && inspectMovie.rottenTomatoes !== 'N/A' && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                    🍅 {inspectMovie.rottenTomatoes}
                  </span>
                )}
              </div>
              <button onClick={() => setInspectMovie(null)} className="p-1 rounded-full bg-slate-800 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4">
              <img
                src={inspectMovie.poster}
                alt={inspectMovie.title}
                className="w-24 h-36 object-cover rounded-xl border border-slate-800 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-white">{inspectMovie.title}</h3>
                <p className="text-xs text-slate-400">{inspectMovie.year} • {inspectMovie.runtime}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {inspectMovie.genre?.map(g => (
                    <span key={g} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{inspectMovie.plot}</p>

            <div className="text-[11px] bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
              <p><strong className="text-slate-500">Director:</strong> {inspectMovie.director}</p>
              <p><strong className="text-slate-500">Cast:</strong> {inspectMovie.cast}</p>
            </div>

            {isInWatchlist(inspectMovie.id) && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Private Note:</label>
                <textarea
                  rows={2}
                  placeholder="Notes, thoughts, or reminders..."
                  value={watchlist.find(m => m.id === inspectMovie.id)?.userNotes || ''}
                  onChange={(e) => handleUpdateEntry(inspectMovie.id, 'userNotes', e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://www.imdb.com/title/${inspectMovie.id}/`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 flex items-center space-x-1 font-bold"
              >
                <span>View on IMDb</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => {
                  if (isInWatchlist(inspectMovie.id)) handleRemoveMovie(inspectMovie.id);
                  else handleSaveMovie(inspectMovie);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isInWatchlist(inspectMovie.id)
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-400 text-black hover:bg-amber-300'
                }`}
              >
                {isInWatchlist(inspectMovie.id) ? 'Remove from Album' : 'Add to Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
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
      )}

      {/* New Shelf Modal */}
      {showNewShelfModal && (
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
      )}
    </div>
  );
}