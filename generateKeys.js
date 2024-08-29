const crypto = require('crypto');

// Function to generate random secret key
function generateSecretKey() {
    return crypto.randomBytes(64).toString('hex');
}

// Generate and print keys for JWT and Session Secret
console.log('JWT_SECRET:', generateSecretKey());
console.log('SESSION_SECRET:', generateSecretKey());
