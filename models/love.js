const mongoose = require('mongoose');

const loveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Love', loveSchema);
