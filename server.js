const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { PayPalClient, Environment, OrdersCreateRequest, OrdersCaptureRequest, WebhookEventVerifyRequest } = require('@paypal/checkout-server-sdk');
const User = require('./models/user');
const Movie = require('./models/movie');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const redis = require('redis');
const axios = require('axios');
const client = redis.createClient({ url: process.env.REDIS_URL });

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY; // Add your TMDB API Key to .env file

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Session management with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 60 * 60 // 1 hour
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Nodemailer setup for email services
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// =======================
// PAYPAL PAYMENT INTEGRATION
// =======================
function createPayPalClient() {
    return new PayPalClient(new Environment.Sandbox(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET));
}

async function createOrder(req, res) {
    const client = createPayPalClient();
    const request = new OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: '10.00' // Adjust this value as needed
            }
        }],
        application_context: {
            return_url: 'http://localhost:3000/checkout-success',
            cancel_url: 'http://localhost:3000/checkout-cancel'
        }
    });

    try {
        const order = await client.execute(request);
        res.status(200).json({ id: order.result.id });
    } catch (err) {
        res.status(500).json({ message: 'Error creating PayPal order', error: err.message });
    }
}

async function captureOrder(req, res) {
    const { orderId } = req.body;
    const client = createPayPalClient();
    const request = new OrdersCaptureRequest(orderId);

    try {
        const capture = await client.execute(request);
        res.status(200).json({ capture });
    } catch (err) {
        res.status(500).json({ message: 'Error capturing PayPal order', error: err.message });
    }
}

// ==============================
// PAYPAL WEBHOOKS
// ==============================
async function verifyPayPalWebhook(webhookEvent) {
    const client = createPayPalClient();
    const request = new WebhookEventVerifyRequest();
    request.body = webhookEvent;

    try {
        const response = await client.execute(request);
        return response.statusCode === 200;
    } catch (error) {
        console.error('Error verifying PayPal webhook:', error);
        return false;
    }
}

async function handleSubscriptionCreated(webhookEvent) {
    console.log('Subscription created:', webhookEvent);
}

async function handlePaymentCompleted(webhookEvent) {
    console.log('Payment completed:', webhookEvent);
}

async function handleSubscriptionCancelled(webhookEvent) {
    console.log('Subscription cancelled:', webhookEvent);
}

app.post('/webhook/paypal', async (req, res) => {
    const webhookEvent = req.body;

    try {
        const verificationStatus = await verifyPayPalWebhook(webhookEvent);
        if (!verificationStatus) {
            return res.status(400).json({ message: 'Invalid webhook event' });
        }

        switch (webhookEvent.event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                await handleSubscriptionCreated(webhookEvent);
                break;
            case 'PAYMENT.SALE.COMPLETED':
                await handlePaymentCompleted(webhookEvent);
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(webhookEvent);
                break;
            default:
                console.log('Unhandled event type:', webhookEvent.event_type);
        }

        res.status(200).json({ message: 'Webhook handled successfully' });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ message: 'Error handling webhook' });
    }
});

// ===============================
// JWT Authentication Middleware
// ===============================
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function adminAuth(req, res, next) {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.sendStatus(403);
    }
}

// ==============================
// Movie Fetching API from TMDB
// ==============================
async function fetchMovies() {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const movies = response.data.results;
    
    // Save movies to the database
    movies.forEach(async (movieData) => {
      const movie = new Movie({
        title: movieData.title,
        overview: movieData.overview,
        releaseDate: movieData.release_date,
        posterPath: movieData.poster_path,
        // Add other fields as needed
      });

      await movie.save();
    });

    console.log('Movies fetched and saved successfully');
  } catch (error) {
    console.error('Error fetching movies:', error);
  }
}

app.get('/admin/fetch-movies', authenticateJWT, adminAuth, async (req, res) => {
  try {
    await fetchMovies();
    res.status(200).send('Movies fetched and stored successfully');
  } catch (error) {
    res.status(500).send('Error fetching movies');
  }
});

// ==============================
// Routes
// ==============================
app.post('/register', async (req, res) => {
    // User registration logic
});

app.post('/login', async (req, res) => {
    // User login logic
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.redirect('/login');
    });
});

app.post('/reset-password', async (req, res) => {
    // Password reset logic
});

app.post('/update-profile', authenticateJWT, async (req, res) => {
    // User profile update logic
});

app.post('/add-movie', authenticateJWT, adminAuth, async (req, res) => {
    // Add movie logic
});

app.put('/update-movie/:id', authenticateJWT, adminAuth, async (req, res) => {
    // Update movie logic
});

app.delete('/delete-movie/:id', authenticateJWT, adminAuth, async (req, res) => {
    // Delete movie logic
});

app.get('/movies', async (req, res) => {
    // Fetch movies with filtering
});

app.get('/recommendations', authenticateJWT, async (req, res) => {
    // Fetch personalized recommendations
});

// Advanced search functionality
app.get('/search', async (req, res) => {
    // Search and filter movies
});

// Handle file uploads
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
    // File upload handling
});

// Placeholder route for CDN integration
// app.use('/cdn', CDN);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
