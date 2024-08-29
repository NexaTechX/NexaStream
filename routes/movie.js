const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');

// Middleware to ensure the user is an admin
const isAdmin = require('../middleware/isAdmin');

// ==============================
// ADMIN: MOVIE MANAGEMENT ROUTES
// ==============================
router.post('/movies', isAdmin, async (req, res) => {
    const { title, genre, year, rating, description, poster } = req.body;

    if (!title || !genre || !year || !rating || !description || !poster) {
        return res.status(400).json({ message: 'All movie fields are required.' });
    }

    try {
        const movie = new Movie({ title, genre, year, rating, description, poster });
        await movie.save();
        res.status(201).json({ message: 'Movie created successfully', movie });
    } catch (err) {
        res.status(500).json({ message: 'Error creating movie', error: err.message });
    }
});

router.put('/movies/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, genre, year, rating, description, poster } = req.body;

    try {
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        movie.title = title || movie.title;
        movie.genre = genre || movie.genre;
        movie.year = year || movie.year;
        movie.rating = rating || movie.rating;
        movie.description = description || movie.description;
        movie.poster = poster || movie.poster;

        await movie.save();
        res.status(200).json({ message: 'Movie updated successfully', movie });
    } catch (err) {
        res.status(500).json({ message: 'Error updating movie', error: err.message });
    }
});

router.delete('/movies/:id', isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        await movie.remove();
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting movie', error: err.message });
    }
});

module.exports = router;
