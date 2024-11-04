// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const { CronJob } = require('cron');
const MongoStore = require('connect-mongo');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Session management with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60, // 1 hour
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log('MongoDB connection error:', err));

// User model
const User = require('./models/user');
// Movie model
const Movie = require('./models/movie');
// Favorite model
const Favorite = require('./models/favorite');
// Watchlist model
const Watchlist = require('./models/watchlist');
// Comment model
const Comment = require('./models/comment');
// Love model
const Love = require('./models/love');

// Function to fetch movies from TMDB
async function fetchMovies() {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const movies = response.data.results;

    for (const movieData of movies) {
      const movie = new Movie({
        title: movieData.title,
        overview: movieData.overview,
        releaseDate: movieData.release_date,
        posterPath: movieData.poster_path,
      });

      await movie.save();
    }

    console.log('Movies fetched and saved successfully');
  } catch (error) {
    console.error('Error fetching movies:', error);
  }
}

// Schedule movie fetching every day at midnight
const job = new CronJob('0 0 * * *', fetchMovies);
job.start();

// =======================
// User Registration
// =======================
app.post('/register', async (req, res) => {
  const { fullname, username, email, phone, password, role } = req.body;

  if (!fullname || !username || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Ensure role is not 'admin'
  if (role === 'admin') {
    return res.status(403).json({ message: 'User cannot register as an admin.' });
  }

  const user = new User({ fullname, username, email, phone, password, role });

  try {
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
});

// =======================
// Admin Registration
// =======================
app.post('/admin/register', async (req, res) => {
  const { fullname, username, email, phone, password } = req.body;

  if (!fullname || !username || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const user = new User({ fullname, username, email, phone, password, role: 'admin', isAdmin: true });

  try {
    await user.save();
    res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering admin', error: error.message });
  }
});

// =======================
// User Login
// =======================
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ==============================
// JWT Authentication Middleware
// ==============================
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}

function adminAuth(req, res, next) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.sendStatus(403); // Forbidden
  }
}

// ==============================
// User Interaction Routes
// ==============================
// Add to favorites
app.post('/movies/:id/favorite', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const favorite = new Favorite({ userId: req.user.id, movieId: id });

  try {
    await favorite.save();
    res.status(201).json({ message: 'Movie added to favorites.' });
  } catch (error) {
    res.status(400).json({ message: 'Error adding to favorites', error: error.message });
  }
});

// Add to watchlist
app.post('/movies/:id/watchlist', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const watchlist = new Watchlist({ userId: req.user.id, movieId: id });

  try {
    await watchlist.save();
    res.status(201).json({ message: 'Movie added to watchlist.' });
  } catch (error) {
    res.status(400).json({ message: 'Error adding to watchlist', error: error.message });
  }
});

// Comment on a movie
app.post('/movies/:id/comment', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const comment = new Comment({ userId: req.user.id, movieId: id, text });

  try {
    await comment.save();
    res.status(201).json({ message: 'Comment added.' });
  } catch (error) {
    res.status(400).json({ message: 'Error adding comment', error: error.message });
  }
});

// "Love" a movie (similar to liking)
app.post('/movies/:id/love', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const love = new Love({ userId: req.user.id, movieId: id });

  try {
    await love.save();
    res.status(201).json({ message: 'Movie loved successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Error loving the movie', error: error.message });
  }
});

// ==============================
// Movie Fetching API from TMDB
// ==============================
async function fetchMoviesFromTMDB() {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const movies = response.data.results;

    for (const movieData of movies) {
      const movie = new Movie({
        title: movieData.title,
        overview: movieData.overview,
        releaseDate: movieData.release_date,
        posterPath: movieData.poster_path,
      });

      await movie.save();
    }

    console.log('Movies fetched and saved successfully');
  } catch (error) {
    console.error('Error fetching movies:', error);
  }
}

// Admin route to fetch movies from TMDB
app.get('/admin/fetch-movies', authenticateJWT, adminAuth, async (req, res) => {
  try {
    await fetchMoviesFromTMDB();
    res.status(200).send('Movies fetched and stored successfully');
  } catch (error) {
    res.status(500).send('Error fetching movies');
  }
});

// ==============================
// Routes (Movies)
// ==============================
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movies', error: error.message });
  }
});

// ==============================
// Start the server
// ==============================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
