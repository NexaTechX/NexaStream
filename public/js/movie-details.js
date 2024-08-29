// Example of fetching and displaying movie details
document.addEventListener('DOMContentLoaded', () => {
    const movieDetails = {
        title: 'Movie Title',
        description: 'This is a great movie.',
        subtitles: ['English', 'Spanish', 'French'],
        audioTracks: ['English', 'Spanish', 'French']
    };

    document.getElementById('movie-title').textContent = movieDetails.title;
    document.getElementById('movie-description').textContent = movieDetails.description;

    // Populate subtitles and audio tracks
    const subtitlesSelect = document.getElementById('subtitles-select');
    movieDetails.subtitles.forEach(subtitle => {
        const option = document.createElement('option');
        option.value = subtitle.toLowerCase();
        option.textContent = subtitle;
        subtitlesSelect.appendChild(option);
    });

    const audioSelect = document.getElementById('audio-select');
    movieDetails.audioTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.toLowerCase();
        option.textContent = track;
        audioSelect.appendChild(option);
    });
});

function playMovie() {
    console.log('Playing movie...');
    // Add actual video playing logic here
}
