// Example of login form submission
document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log(`Logging in with Email: ${email}`);
    // Add actual login logic here
});
