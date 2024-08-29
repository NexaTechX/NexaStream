const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    genre: {
        type: [String],
        required: true
    },
    releaseDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    poster: {
        type: String,
        required: true
    },
    trailerUrl: {
        type: String,
        required: true
    },
    movieUrl: {
        type: String,
        required: true
    },
    cast: [{
        actor: {
            type: String,
            required: true
        },
        character: {
            type: String,
            required: true
        }
    }],
    subtitles: [{
        language: String,
        url: String
    }],
    categories: {
        type: [String],
        default: []
    },
    contentRating: {
        type: String,
        required: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true },
        comment: { type: String }
    }]
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
