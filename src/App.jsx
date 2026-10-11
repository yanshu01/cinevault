import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, ArrowRight } from 'lucide-react';

import { 
  auth, 
  db, 
  isDemoFirebase, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc 
} from './firebase';

import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import AuthScreen from './components/modals/AuthScreen';
import AccountModal from './components/modals/AccountModal';
import MovieInspectModal from './components/modals/MovieInspectModal';
import ApiKeyModal from './components/modals/ApiKeyModal';
import NewShelfModal from './components/modals/NewShelfModal';
import MovieSwipeDiscovery from './components/MovieSwipeDiscovery.jsx';

import DiscoverView from './views/DiscoverView';
import WatchlistView from './views/WatchlistView';
import Recommendations from './components/Recommendations';

import { useWatchlist } from './hooks/useWatchlist';
import { useOmdbSearch } from './hooks/useOmdbSearch';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Active view: 'landing' | 'discover' | 'recommendations' | 'watchlist'
  const [activeTab, setActiveTab] = useState('landing');

  // Modals & Feedback
  const [inspectMovie, setInspectMovie] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showNewShelfModal, setShowNewShelfModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Auth Form State
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // OMDb API Key
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('omdb_api_key') || import.meta.env.VITE_OMDB_API_KEY || '';
  });

  const triggerToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  const {
    watchlist,
    shelves,
    syncStatus,
    stats,
    handleSaveMovie,
    handleUpdateEntry,
    handleRemoveMovie,
    handleAddShelf,
    isInWatchlist
  } = useWatchlist(user, triggerToast, setApiKey);

  const {
    searchQuery,
    selectedOrigin,
    setSelectedOrigin,
    apiSearching,
    onSearchChange,
    combinedMovies
  } = useOmdbSearch(apiKey);

  useEffect(() => {
    if (isDemoFirebase || !auth) {
      const cached = localStorage.getItem('cinevault_demo_session');
      if (cached) setUser(JSON.parse(cached));
      setAuthChecking(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return () => unsub();
  }, []);

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
      setShowAccountModal(false);
      triggerToast('Signed out');
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmitNewShelf = async (e) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    await handleAddShelf(newShelfName);
    setNewShelfName('');
    setShowNewShelfModal(false);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#07090f] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  // --- FULLSCREEN LANDING SWIPE VIEW (No Navbar, No MobileNav, No Headers) ---
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-center items-center p-4 relative selection:bg-amber-500 selection:text-black">
        {feedbackMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 stroke-3" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Floating exit to full app / watchlist */}
        <button
          onClick={() => setActiveTab('watchlist')}
          className="fixed top-5 right-5 z-40 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition"
        >
          <span>My Vault ({watchlist.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Pure Swipe Deck Landing */}
        <div className="w-full max-w-sm flex flex-col items-center">
          <MovieSwipeDiscovery
            movies={combinedMovies}
            onSaveToWatchlist={handleSaveMovie}
            onInspectMovie={setInspectMovie}
          />
        </div>

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
      </div>
    );
  }

  // --- REGULAR APPLICATION VIEW (Navbar, MobileNav, Search, Shelves & Recommendations) ---
  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 font-sans pb-24 md:pb-10 selection:bg-amber-500 selection:text-black">
      {feedbackMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 stroke-3" />
          <span>{feedbackMsg}</span>
        </div>
      )}

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

      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5">
        {activeTab === 'discover' && (
          <DiscoverView
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            apiKey={apiKey}
            apiSearching={apiSearching}
            combinedMovies={combinedMovies}
            selectedOrigin={selectedOrigin}
            setSelectedOrigin={setSelectedOrigin}
            isInWatchlist={isInWatchlist}
            onSaveMovie={handleSaveMovie}
            onRemoveMovie={handleRemoveMovie}
            onInspectMovie={setInspectMovie}
          />
        )}

        {activeTab === 'recommendations' && (
  <Recommendations
    onNavigateToSwipe={() => setActiveTab('landing')}
    onSaveToWatchlist={handleSaveMovie}
    isInWatchlist={isInWatchlist}
    apiKey={apiKey}
  />
)}

        {activeTab === 'watchlist' && (
          <WatchlistView
            watchlist={watchlist}
            shelves={shelves}
            onUpdateEntry={handleUpdateEntry}
            onRemoveMovie={handleRemoveMovie}
            onInspectMovie={setInspectMovie}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}
      </main>

      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistLength={watchlist.length}
        setShowNewShelfModal={setShowNewShelfModal}
        setShowAccountModal={setShowAccountModal}
      />

      {showAccountModal && (
        user ? (
          <AccountModal
            user={user}
            stats={stats}
            handleLogout={handleLogout}
            setShowAccountModal={setShowAccountModal}
          />
        ) : (
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
            onClose={() => setShowAccountModal(false)}
            onBack={() => setShowAccountModal(false)}
          />
        )
      )}

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

      {showKeyModal && (
        <ApiKeyModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          setShowKeyModal={setShowKeyModal}
          triggerToast={triggerToast}
        />
      )}

      {showNewShelfModal && (
        <NewShelfModal
          newShelfName={newShelfName}
          setNewShelfName={setNewShelfName}
          setShowNewShelfModal={setShowNewShelfModal}
          handleAddShelf={onSubmitNewShelf}
        />
      )}
    </div>
  );
}