const axios = require('axios');

const TMDB_API_KEY = 'your_tmdb_api_key'; // Replace with your actual TMDb API key

async function fetchMovies() {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const movies = response.data.results;

    // You can add logic here to save movies to your database
    console.log(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
  }
}

fetchMovies();
