// Example of registration form submission
document.getElementById('register-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log(`Registering user: ${username}, Email: ${email}`);
    // Add actual registration logic here
});


document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
  
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phone = document.getElementById('phone').value;
  
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
  
    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullname, email, password, phone }),
    })
    .then(response => {
      if (response.ok) {
        window.location.href = 'index.html'; // Redirect to home page
      } else {
        alert('Registration failed. Please try again.');
      }
    })
    .catch(error => {
      alert('Error: ' + error.message);
    });
  });
  