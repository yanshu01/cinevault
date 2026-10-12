import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Film, Star, RotateCcw, ExternalLink, Heart, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchFreshMovieDeck } from '../services/movieService';
import { recordMovieSwipe } from '../services/movieStatsService';

interface Movie {
  id: string;
  title: string;
  year: string;
  industry: string;
  genre: string;
  rating: string;
  poster: string;
  imdbUrl: string;
  rtUrl: string;
}

interface MovieCardProps {
  movie: Movie;
  onSwipe: (dir: 'left' | 'right') => void;
  forcedDirection: 'left' | 'right' | null;
}

function MovieCard({ movie, onSwipe, forcedDirection }: MovieCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-20, 20]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-30, -120], [0, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocityThreshold = 350;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    }
  };

  const getExitX = () => {
    if (forcedDirection === 'right') return 500;
    if (forcedDirection === 'left') return -500;
    return x.get() >= 0 ? 500 : -500;
  };

  return (
    <motion.div
      key={movie.id}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{
        x: getExitX(),
        opacity: 0,
        rotate: getExitX() > 0 ? 25 : -25,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 rounded-3xl overflow-hidden bg-[#0e1322] border border-slate-800 shadow-2xl cursor-grab flex flex-col select-none touch-none"
    >
      <img
        src={movie.poster}
        alt={movie.title}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
        }}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Swipe Badges */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 left-6 border-4 border-emerald-400 text-emerald-400 font-black text-xl px-4 py-1 rounded-xl -rotate-12 pointer-events-none tracking-wider bg-black/40 backdrop-blur-xs"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-6 right-6 border-4 border-rose-500 text-rose-500 font-black text-xl px-4 py-1 rounded-xl rotate-12 pointer-events-none tracking-wider bg-black/40 backdrop-blur-xs"
      >
        NOPE
      </motion.div>

      {/* Movie Information Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-5 pt-16 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-black">
              {movie.industry}
            </span>
            <span className="text-[10px] text-slate-300 flex items-center font-medium">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 mr-1" />
              {movie.rating}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <a
              href={movie.imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="px-2 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[10px] font-bold flex items-center transition border border-amber-400/30"
            >
              <span>IMDb</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
            <a
              href={movie.rtUrl}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center transition border border-rose-500/30"
            >
              <span>Rotten Tomatoes</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
          </div>
        </div>

        <h2 className="text-xl font-black text-white leading-tight">
          {movie.title}{' '}
          <span className="text-sm font-normal text-slate-400">({movie.year})</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{movie.genre}</p>
      </div>
    </motion.div>
  );
}

export default function MovieSwipeDiscovery() {
  const [deck, setDeck] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forcedDirection, setForcedDirection] = useState<'left' | 'right' | null>(null);

  const loadMovies = async () => {
    setIsLoading(true);
    setError(null);
    setForcedDirection(null);
    try {
      const freshMovies = await fetchFreshMovieDeck(10);
      setDeck(freshMovies || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to fetch a fresh deck of movies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const activeMovie = deck[currentIndex];
  const nextMovie = deck[currentIndex + 1];
  const isFinished = !isLoading && deck.length > 0 && currentIndex >= deck.length;

  const handleDecision = (direction: 'left' | 'right') => {
    const currentMovie = deck[currentIndex];
    if (!currentMovie) return;

    // 1. Record decision to Firebase Firestore in the background
    recordMovieSwipe(currentMovie, direction);

    // 2. Set card exit animation direction and advance deck state
    setForcedDirection(direction);
    setCurrentIndex((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 h-dvh w-full bg-[#07090f] flex flex-col items-center justify-center text-slate-300 space-y-3">
        <Loader2 className="w-9 h-9 text-amber-400 animate-spin stroke-[2.2]" />
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Curating movie deck...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 h-dvh w-full bg-[#07090f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#0f1426] border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Network Error</h2>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
          <button
            onClick={loadMovies}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden overscroll-none touch-none bg-[#07090f] text-slate-100 flex flex-col justify-between items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Film className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
              CineVault
            </h1>
            <p className="text-[10px] text-slate-400">Public Movie Matcher</p>
          </div>
        </div>

        {!isFinished && deck.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-300">
            {currentIndex + 1} / {deck.length}
          </span>
        )}
      </header>

      {/* Main Area */}
      <main className="w-full max-w-sm flex-1 flex flex-col items-center justify-center relative my-auto min-h-0 py-2">
        {!isFinished ? (
          <div className="relative w-full h-[65vh] max-h-[500px] min-h-[350px]">
            {/* Background Preview Card */}
            {nextMovie && (
              <motion.div
                key={nextMovie.id}
                initial={{ scale: 0.92, opacity: 0.4, y: 12 }}
                animate={{ scale: 0.95, opacity: 0.6, y: 8 }}
                className="absolute inset-0 rounded-3xl bg-slate-900/60 border border-slate-800/80 overflow-hidden pointer-events-none"
              >
                <img
                  src={nextMovie.poster}
                  alt={nextMovie.title}
                  className="w-full h-full object-cover opacity-50 blur-[1px]"
                />
              </motion.div>
            )}

            {/* Top Swipable Card */}
            <AnimatePresence mode="popLayout" onExitComplete={() => setForcedDirection(null)}>
              {activeMovie && (
                <MovieCard
                  key={activeMovie.id}
                  movie={activeMovie}
                  onSwipe={handleDecision}
                  forcedDirection={forcedDirection}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Finished State */
          <div className="w-full max-w-sm bg-[#0f1426] border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white tracking-tight">
                Your feedback is submitted to the system
              </h2>
              <p className="text-sm text-slate-400 font-medium">Thank you!</p>
            </div>

            <button
              onClick={loadMovies}
              className="mt-4 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Fetch New Movies</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer Swipe Buttons */}
      {!isFinished && (
        <footer className="w-full max-w-xs flex items-center justify-center space-x-8 pb-3">
          <button
            onClick={() => handleDecision('left')}
            className="w-14 h-14 rounded-full bg-slate-900/80 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg active:scale-90 transition hover:bg-rose-500/10 cursor-pointer"
            aria-label="Pass"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
          <button
            onClick={() => handleDecision('right')}
            className="w-14 h-14 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg active:scale-90 transition hover:bg-emerald-500/10 cursor-pointer"
            aria-label="Like"
          >
            <Heart className="w-6 h-6 stroke-[2.5]" />
          </button>
        </footer>
      )}
    </div>
  );
}