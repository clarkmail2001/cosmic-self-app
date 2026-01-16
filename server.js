require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const twilio = require('twilio');
const cron = require('node-cron');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
      twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Database connection
const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet({
      contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
});
app.use('/api/', limiter);

// JWT Middleware
const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) return res.status(401).json({ error: 'Access denied' });

      jwt.verify(token, process.env.JWT_SECRET || 'cosmic-secret-key', (err, user) => {
                if (err) return res.status(403).json({ error: 'Invalid token' });
                req.user = user;
          next();
      });
};

// Health check
app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
      try {
                const { email, password, name, birthDate, birthTime, birthPlace, phone } = req.body;

          const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
                if (existingUser.rows.length > 0) {
                              return res.status(400).json({ error: 'Email already registered' });
                }

          const hashedPassword = await bcrypt.hash(password, 10);
                const lifePath = calculateLifePath(birthDate);
                const sunSign = getSunSign(birthDate);
                const chineseZodiac = getChineseZodiac(birthDate);

          const result = await pool.query(
                        `INSERT INTO users (email, password, name, birth_date, birth_time, birth_place, phone, life_path, sun_sign, chinese_zodiac)
                                     VALUES ($1, $require('dotenv').config();
                                     const express = require('express');
                                     const { Pool } = require('pg');
                                     const bcrypt = require('bcryptjs');
                                     const jwt = require('jsonwebtoken');
                                     const Stripe = require('stripe');
                                     const twilio = require('twilio');
                                     const cron = require('node-cron');
                                     const cors = require('cors');
                                     const helmet = require('helmet');
                                     const rateLimit = require('express-rate-limit');
                                     const path = require('path');

                                     const app = express();
                                     const PORT = process.env.PORT || 3000;

                                     // Initialize services
                                     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                                     const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
                                         twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

                                         // Database connection
                                         const pool = new Pool({
                                             connectionString: process.env.DATABASE_URL,
                                                 ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
                                                 });

                                                 // Middleware
                                                 app.use(helmet({
                                                     contentSecurityPolicy: false
                                                     }));
                                                     app.use(cors());
                                                     app.use(express.json());
                                                     app.use(express.static('public'));

                                                     // Rate limiting
                                                     const limiter = rateLimit({
                                                         windowMs: 15 * 60 * 1000,
                                                             max: 100
                                                             });
                                                             app.use('/api/', limit
