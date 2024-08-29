document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    
    try {
        const response = await fetch(`/api/movies/${movieId}`);
        const movie = await response.json();
        
        const movieContainer = document.getElementById('movie-container');
        movieContainer.innerHTML = `
            <h3>${movie.title}</h3>
            <p><strong>Genre:</strong> ${movie.genre}</p>
            <p><strong>Year:</strong> ${movie.year}</p>
            <p><strong>Rating:</strong> ${movie.rating}</p>
            <p>${movie.description}</p>
            <img src="${movie.poster}" alt="${movie.title}" style="width: 100%;">
        `;
    } catch (err) {
        console.error('Error fetching movie details:', err);
    }
});
