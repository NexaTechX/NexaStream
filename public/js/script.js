document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const mainContent = document.getElementById('mainContent');

  // Toggle navigation menu on click
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    document.body.classList.toggle('menu-active'); // Prevent scrolling when menu is open
  });

  // Close menu when clicking outside
  mainContent.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      document.body.classList.remove('menu-active');
    }
  });
});
