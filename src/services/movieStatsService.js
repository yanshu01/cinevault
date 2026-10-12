import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  increment, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { PRELOADED_MOVIES } from '../data/preloadedMovies';

/**
 * Increments global likes/dislikes for a movie.
 * Creates the document if it doesn't exist yet.
 */
export async function recordMovieSwipe(movie, direction) {
  if (!movie || !movie.id) return;

  const movieRef = doc(db, 'movie_stats', String(movie.id));

  const updatePayload = {
    title: movie.title,
    year: movie.year || 'N/A',
    poster: movie.poster,
    genre: movie.genre || '',
    industry: movie.industry || '',
    rating: movie.rating || 'NR',
    imdbUrl: movie.imdbUrl || '',
    rtUrl: movie.rtUrl || '',
    likesCount: direction === 'right' ? increment(1) : increment(0),
    dislikesCount: direction === 'left' ? increment(1) : increment(0),
    totalSwipes: increment(1),
    lastSwipedAt: new Date()
  };

  try {
    await setDoc(movieRef, updatePayload, { merge: true });
  } catch (error) {
    console.error('Error recording swipe to Firestore:', error);
  }
}

/**
 * Fetches the top-rated recommendations based on total right-swipes across all users.
 * Falls back to preloaded movies if Firestore fails or permissions are restricted.
 */
export async function fetchTopRecommendations(limitCount = 10) {
  try {
    const q = query(
      collection(db, 'movie_stats'),
      orderBy('likesCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.warn('Firebase permissions error or offline, loading fallback recommendations:', error);

    // Fallback: Return top preloaded movies sorted by rating so the UI never displays empty
    return (PRELOADED_MOVIES || []).slice(0, limitCount).map((m, idx) => ({
      ...m,
      likesCount: Math.max(10 - idx, 1)
    }));
  }
}