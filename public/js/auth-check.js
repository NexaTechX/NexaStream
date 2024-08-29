document.addEventListener('DOMContentLoaded', function() {
  fetch('/check-auth')
      .then(response => response.json())
      .then(data => {
          if (!data.authenticated) {
              window.location.href = 'get-started.html'; // Redirect to Get Started page if not authenticated
          } else {
              window.location.href = 'index.html'; // Redirect to Home page if authenticated
          }
      });
});
