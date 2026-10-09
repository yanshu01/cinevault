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
 */
export async function fetchTopRecommendations(count = 10) {
  try {
    const q = query(
      collection(db, 'movie_stats'),
      orderBy('likesCount', 'desc'),
      limit(count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}