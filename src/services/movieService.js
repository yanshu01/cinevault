const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';

const STORAGE_KEY_SEEN = 'cinevault_seen_ids';
const STORAGE_KEY_PAGE = 'cinevault_current_page';

// Genre lookup helper
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller'
};

export const getSeenMovieIds = () => {
  const seen = localStorage.getItem(STORAGE_KEY_SEEN);
  return seen ? JSON.parse(seen) : [];
};

export const markMoviesAsSeen = (ids) => {
  const current = getSeenMovieIds();
  const updated = Array.from(new Set([...current, ...ids]));
  localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(updated));
};

export async function fetchFreshMovieDeck(batchSize = 10) {
  let seenIds = new Set(getSeenMovieIds());
  let currentPage = parseInt(localStorage.getItem(STORAGE_KEY_PAGE) || '1', 10);
  const collectedMovies = [];

  // Continue requesting pages until we collect `batchSize` unvisited movies
  while (collectedMovies.length < batchSize) {
    const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_count.desc&vote_average.gte=7.0&page=${currentPage}&include_adult=false`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      // Reached the end of available catalog; loop back or stop
      break;
    }

    for (const item of data.results) {
      if (collectedMovies.length >= batchSize) break;

      // Skip movies already seen by this user
      if (seenIds.has(String(item.id))) continue;
      if (!item.poster_path) continue; // Skip cards without posters

      const genreNames = (item.genre_ids || [])
        .map((gId) => GENRE_MAP[gId])
        .filter(Boolean)
        .slice(0, 2)
        .join(' / ');

      // Build clean movie item
      collectedMovies.push({
        id: String(item.id),
        title: item.title,
        year: item.release_date ? item.release_date.split('-')[0] : 'N/A',
        industry: item.original_language === 'hi' ? 'Bollywood' : 'Hollywood',
        genre: genreNames || 'Feature',
        rating: item.vote_average ? item.vote_average.toFixed(1) : 'NR',
        poster: `${IMAGE_BASE_URL}${item.poster_path}`,
        // TMDB ID and search link fallbacks for IMDb & RT
        imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(item.title)}`,
        rtUrl: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(item.title)}`
      });
    }

    currentPage += 1;
    localStorage.setItem(STORAGE_KEY_PAGE, String(currentPage));
  }

  // Mark all fetched movies as seen in localStorage
  markMoviesAsSeen(collectedMovies.map((m) => m.id));

  return collectedMovies;
}