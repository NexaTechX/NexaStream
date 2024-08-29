// Example of fetching and displaying user profile data
document.addEventListener('DOMContentLoaded', () => {
    // Simulate fetching user profile data
    const userProfile = {
        username: 'JohnDoe',
        email: 'john@example.com',
        watchHistory: ['Movie 1', 'Movie 2']
    };

    document.getElementById('username').textContent = userProfile.username;
    document.getElementById('email').textContent = userProfile.email;

    // Populate watch history
    const watchHistoryContainer = document.getElementById('watch-history');
    userProfile.watchHistory.forEach(movie => {
        const div = document.createElement('div');
        div.textContent = movie;
        watchHistoryContainer.appendChild(div);
    });
});
