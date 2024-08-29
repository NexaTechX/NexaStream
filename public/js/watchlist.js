// Example of fetching and displaying watchlist items
document.addEventListener('DOMContentLoaded', () => {
    // Simulate fetching watchlist data
    const watchlist = ['Movie A', 'Movie B', 'Movie C'];

    const watchlistContainer = document.getElementById('watchlist');
    watchlist.forEach(movie => {
        const div = document.createElement('div');
        div.textContent = movie;
        watchlistContainer.appendChild(div);
    });
});
