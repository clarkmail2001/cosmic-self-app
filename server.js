require('dotenv').config();

// Admin emails that get free access to all features
const ADMIN_EMAILS = ['allwalksoflife26@gmail.com'];

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
app.use(express.static('.'));

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

// ============== AUTH ROUTES ==============

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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, name`,
      [email, hashedPassword, name, birthDate, birthTime, birthPlace, phone, lifePath, sunSign, chineseZodiac]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET || 'cosmic-secret-key');
    res.json({ user: result.rows[0], token });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'cosmic-secret-key');
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lifePath: user.life_path,
        sunSign: user.sun_sign,
        chineseZodiac: user.chinese_zodiac,
        subscription: user.subscription_tier,
        hasLifeEssay: user.has_life_essay,
        hasYearEssay: user.has_year_essay,
        hasReadingList: user.has_reading_list
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, birth_date, birth_time, birth_place, life_path, sun_sign, chinese_zodiac, 
              subscription_tier, has_life_essay, has_year_essay, has_reading_list, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============== STRIPE ROUTES ==============

// Create donation checkout session
app.post('/api/stripe/donate', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Support Cosmic Self',
            description: 'Thank you for supporting our mission to help people understand their cosmic blueprint.'
          },
          unit_amount: amount || 500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=donation`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to create donation session' });
  }
});

// Purchase Life Essay ($15 one-time)
app.post('/api/stripe/life-essay', authenticateToken, async (req, res) => {
  try {
    if (ADMIN_EMAILS.includes(req.user.email)) {
      await pool.query('UPDATE users SET has_life_essay = true WHERE id = $1', [req.user.id]);
      return res.json({ success: true, message: 'Admin access granted', adminBypass: true });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Personalized Life Essay',
            description: '15 personalized paragraphs exploring your complete cosmic blueprint.'
          },
          unit_amount: 1500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { userId: req.user.id.toString(), type: 'life_essay' },
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=life_essay`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/pricing`,
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Life essay purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase session' });
  }
});

// Purchase Year Essay ($5 one-time)
app.post('/api/stripe/year-essay', authenticateToken, async (req, res) => {
  try {
    if (ADMIN_EMAILS.includes(req.user.email)) {
      await pool.query('UPDATE users SET has_year_essay = true WHERE id = $1', [req.user.id]);
      return res.json({ success: true, message: 'Admin access granted', adminBypass: true });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Personalized Year Essay',
            description: '5 paragraphs exploring your cosmic influences for the year ahead.'
          },
          unit_amount: 500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { userId: req.user.id.toString(), type: 'year_essay' },
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=year_essay`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/pricing`,
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Year essay purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase session' });
  }
});

// Purchase Reading List ($5 one-time)
app.post('/api/stripe/reading-list', authenticateToken, async (req, res) => {
  try {
    if (ADMIN_EMAILS.includes(req.user.email)) {
      await pool.query('UPDATE users SET has_reading_list = true WHERE id = $1', [req.user.id]);
      return res.json({ success: true, message: 'Admin access granted', adminBypass: true });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Personalized Reading List',
            description: 'Curated book recommendations based on your cosmic blueprint.'
          },
          unit_amount: 500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { userId: req.user.id.toString(), type: 'reading_list' },
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=reading_list`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/pricing`,
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Reading list purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase session' });
  }
});

// Subscribe to SMS ($10/month)
app.post('/api/stripe/subscribe-sms', authenticateToken, async (req, res) => {
  try {
    let price;
    const prices = await stripe.prices.list({ lookup_keys: ['cosmic_sms_monthly'] });
    
    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      const product = await stripe.products.create({
        name: 'Cosmic SMS Guidance',
        description: '3x weekly personalized cosmic guidance + full site access'
      });
      
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 1000,
        currency: 'usd',
        recurring: { interval: 'month' },
        lookup_key: 'cosmic_sms_monthly'
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      metadata: { userId: req.user.id.toString(), type: 'sms_subscription' },
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=sms`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/pricing`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('SMS subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription session' });
  }
});

// Stripe Webhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const type = session.metadata?.type;
      
      if (userId && type) {
        switch (type) {
          case 'life_essay':
            await pool.query('UPDATE users SET has_life_essay = true WHERE id = $1', [userId]);
            console.log(`Life essay unlocked for user ${userId}`);
            break;
          case 'year_essay':
            await pool.query('UPDATE users SET has_year_essay = true WHERE id = $1', [userId]);
            console.log(`Year essay unlocked for user ${userId}`);
            break;
          case 'reading_list':
            await pool.query('UPDATE users SET has_reading_list = true WHERE id = $1', [userId]);
            console.log(`Reading list unlocked for user ${userId}`);
            break;
          case 'sms_subscription':
            await pool.query(
              'UPDATE users SET subscription_tier = $1, stripe_customer_id = $2, has_life_essay = true, has_year_essay = true, has_reading_list = true WHERE id = $3',
              ['sms', session.customer, userId]
            );
            console.log(`SMS subscription activated for user ${userId} - full access granted`);
            break;
        }
      }
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await pool.query(
        'UPDATE users SET subscription_tier = $1 WHERE stripe_customer_id = $2',
        ['free', subscription.customer]
      );
      console.log(`Subscription cancelled for customer ${subscription.customer}`);
      break;
  }
  
  res.json({ received: true });
});

// ============== CONTENT RETRIEVAL ROUTES ==============

// Get Life Essay
app.get('/api/reading/life-essay', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    if (!user.has_life_essay && !isAdmin) {
      return res.status(403).json({ error: 'Life essay not purchased' });
    }
    
    const cached = await pool.query('SELECT content FROM life_essays WHERE user_id = $1', [req.user.id]);
    
    if (cached.rows.length > 0) {
      return res.json({ essay: cached.rows[0].content });
    }
    
    const essay = generateLifeEssay(user);
    await pool.query(
      'INSERT INTO life_essays (user_id, content) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET content = $2, generated_at = NOW()',
      [req.user.id, essay]
    );
    
    res.json({ essay });
  } catch (error) {
    console.error('Life essay error:', error);
    res.status(500).json({ error: 'Failed to generate essay' });
  }
});

// Get Year Essay
app.get('/api/reading/year-essay', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    if (!user.has_year_essay && !isAdmin) {
      return res.status(403).json({ error: 'Year essay not purchased' });
    }
    
    const currentYear = new Date().getFullYear();
    const cached = await pool.query(
      'SELECT content FROM year_essays WHERE user_id = $1 AND year = $2',
      [req.user.id, currentYear]
    );
    
    if (cached.rows.length > 0) {
      return res.json({ essay: cached.rows[0].content });
    }
    
    const essay = generateYearEssay(user, currentYear);
    await pool.query(
      'INSERT INTO year_essays (user_id, year, content) VALUES ($1, $2, $3) ON CONFLICT (user_id, year) DO UPDATE SET content = $3, generated_at = NOW()',
      [req.user.id, currentYear, essay]
    );
    
    res.json({ essay });
  } catch (error) {
    console.error('Year essay error:', error);
    res.status(500).json({ error: 'Failed to generate essay' });
  }
});

// Get Reading List
app.get('/api/reading/reading-list', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    if (!user.has_reading_list && !isAdmin) {
      return res.status(403).json({ error: 'Reading list not purchased' });
    }
    
    const cached = await pool.query('SELECT content FROM reading_lists WHERE user_id = $1', [req.user.id]);
    
    if (cached.rows.length > 0) {
      return res.json({ readingList: cached.rows[0].content });
    }
    
    const readingList = generateReadingList(user);
    await pool.query(
      'INSERT INTO reading_lists (user_id, content) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET content = $2, generated_at = NOW()',
      [req.user.id, readingList]
    );
    
    res.json({ readingList });
  } catch (error) {
    console.error('Reading list error:', error);
    res.status(500).json({ error: 'Failed to generate reading list' });
  }
});

// Get current cosmic weather
app.get('/api/reading/cosmic-weather', (req, res) => {
  const weather = getCurrentCosmicWeather();
  res.json(weather);
});

// ============== SMS ROUTES ==============

// Update phone number
app.post('/api/user/phone', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    await pool.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Phone update error:', error);
    res.status(500).json({ error: 'Failed to update phone' });
  }
});

// Send test SMS
app.post('/api/sms/test', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (!user.rows[0].phone) {
      return res.status(400).json({ error: 'No phone number on file' });
    }
    
    if (!twilioClient) {
      return res.status(400).json({ error: 'SMS service not configured' });
    }
    
    const message = generatePersonalizedSMS(user.rows[0]);
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.rows[0].phone
    });
    
    res.json({ success: true, message: 'Test SMS sent' });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// ============== HELPER FUNCTIONS ==============

function calculateLifePath(birthDate) {
  const parts = birthDate.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  function reduceToDigit(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = String(num).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    }
    return num;
  }
  
  const yearSum = reduceToDigit(year.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0));
  const monthSum = reduceToDigit(parseInt(month));
  const daySum = reduceToDigit(parseInt(day));
  
  return reduceToDigit(yearSum + monthSum + daySum);
}

function getSunSign(birthDate) {
  const parts = birthDate.split('-');
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  const signs = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];
  
  for (let sign of signs) {
    if ((month === sign.start[0] && day >= sign.start[1]) ||
        (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return 'Capricorn';
}

function getChineseZodiac(birthDate) {
  const year = parseInt(birthDate.split('-')[0]);
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const index = (year - 1900) % 12;
  return animals[index >= 0 ? index : index + 12];
}

function getChineseElement(birthDate) {
  const year = parseInt(birthDate.split('-')[0]);
  const elements = ['Metal', 'Metal', 'Water', 'Water', 'Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth'];
  const index = (year - 1900) % 10;
  return elements[index >= 0 ? index : index + 10];
}

function getMoonPhase() {
  const synodicMonth = 29.53058867;
  const knownNewMoon = new Date('2024-01-11').getTime();
  const now = new Date().getTime();
  const diff = now - knownNewMoon;
  const days = diff / (1000 * 60 * 60 * 24);
  const phase = ((days % synodicMonth) + synodicMonth) % synodicMonth;
  
  if (phase < 1.85) return { name: 'New Moon', energy: 'beginnings', icon: '🌑' };
  if (phase < 7.38) return { name: 'Waxing Crescent', energy: 'intention', icon: '🌒' };
  if (phase < 9.23) return { name: 'First Quarter', energy: 'action', icon: '🌓' };
  if (phase < 14.77) return { name: 'Waxing Gibbous', energy: 'refinement', icon: '🌔' };
  if (phase < 16.61) return { name: 'Full Moon', energy: 'illumination', icon: '🌕' };
  if (phase < 22.15) return { name: 'Waning Gibbous', energy: 'gratitude', icon: '🌖' };
  if (phase < 24.00) return { name: 'Last Quarter', energy: 'release', icon: '🌗' };
  return { name: 'Waning Crescent', energy: 'surrender', icon: '🌘' };
}

function getPersonalYear(birthDate) {
  const currentYear = new Date().getFullYear();
  const parts = birthDate.split('-');
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  function reduceToDigit(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = String(num).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    }
    return num;
  }
  
  const yearSum = reduceToDigit(String(currentYear).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0));
  const monthSum = reduceToDigit(month);
  const daySum = reduceToDigit(day);
  
  return reduceToDigit(yearSum + monthSum + daySum);
}

// ============== CONTENT GENERATION ==============

const LIFE_PATH_DATA = {
  1: {
    essence: "The Pioneer",
    traits: "independent, ambitious, innovative, self-reliant",
    purpose: "to develop individuality and lead by example",
    challenges: "overcoming self-doubt, avoiding arrogance, learning to collaborate",
    gifts: "natural leadership, original thinking, courage to forge new paths"
  },
  2: {
    essence: "The Peacemaker",
    traits: "diplomatic, intuitive, cooperative, sensitive",
    purpose: "to bring harmony and partnership into the world",
    challenges: "setting boundaries, overcoming passivity, trusting your own judgment",
    gifts: "deep empathy, mediation skills, ability to see multiple perspectives"
  },
  3: {
    essence: "The Communicator",
    traits: "creative, expressive, optimistic, social",
    purpose: "to inspire others through creative self-expression",
    challenges: "avoiding scattered energy, overcoming superficiality, channeling talents",
    gifts: "artistic ability, infectious joy, power to uplift through words and art"
  },
  4: {
    essence: "The Builder",
    traits: "practical, disciplined, loyal, hardworking",
    purpose: "to create lasting foundations and bring order to chaos",
    challenges: "avoiding rigidity, embracing change, balancing work and rest",
    gifts: "reliability, organizational mastery, ability to manifest tangible results"
  },
  5: {
    essence: "The Freedom Seeker",
    traits: "adventurous, versatile, curious, dynamic",
    purpose: "to experience life fully and teach others about freedom",
    challenges: "avoiding excess, developing commitment, finding focus",
    gifts: "adaptability, magnetism, ability to embrace and navigate change"
  },
  6: {
    essence: "The Nurturer",
    traits: "responsible, caring, protective, harmonious",
    purpose: "to serve family and community through love and responsibility",
    challenges: "avoiding martyrdom, setting healthy boundaries, accepting imperfection",
    gifts: "unconditional love, healing presence, creating beauty and harmony"
  },
  7: {
    essence: "The Seeker",
    traits: "analytical, introspective, spiritual, wise",
    purpose: "to seek truth and share wisdom with the world",
    challenges: "avoiding isolation, trusting intuition, opening to others",
    gifts: "profound insight, research abilities, connection to the mystical"
  },
  8: {
    essence: "The Powerhouse",
    traits: "ambitious, authoritative, efficient, successful",
    purpose: "to achieve material mastery and use power wisely",
    challenges: "balancing material and spiritual, avoiding control, ethical leadership",
    gifts: "business acumen, manifestation ability, capacity for great achievement"
  },
  9: {
    essence: "The Humanitarian",
    traits: "compassionate, generous, creative, idealistic",
    purpose: "to serve humanity and bring cycles to completion",
    challenges: "letting go of the past, avoiding resentment, accepting endings",
    gifts: "universal love, artistic talent, wisdom from many experiences"
  },
  11: {
    essence: "The Intuitive Illuminator",
    traits: "visionary, inspirational, sensitive, enlightened",
    purpose: "to channel higher wisdom and inspire spiritual awakening",
    challenges: "grounding visions in reality, managing sensitivity, avoiding anxiety",
    gifts: "psychic ability, inspirational leadership, bridge between worlds"
  },
  22: {
    essence: "The Master Builder",
    traits: "visionary, practical, powerful, accomplished",
    purpose: "to turn the biggest dreams into reality for humanity's benefit",
    challenges: "enormous pressure, balancing idealism and practicality, patience",
    gifts: "ability to manifest large-scale visions, combining dreams with discipline"
  },
  33: {
    essence: "The Master Teacher",
    traits: "selfless, nurturing, wise, healing",
    purpose: "to uplift humanity through unconditional love and teaching",
    challenges: "self-sacrifice, maintaining boundaries, embodying ideals",
    gifts: "profound healing ability, spiritual leadership, nurturing transformation"
  }
};

const SUN_SIGN_DATA = {
  Aries: {
    element: "Fire",
    quality: "Cardinal",
    ruler: "Mars",
    essence: "the initiator of the zodiac, bringing courage and new beginnings wherever they go",
    traits: "bold, direct, competitive, enthusiastic",
    shadow: "impatience, aggression, selfishness"
  },
  Taurus: {
    element: "Earth",
    quality: "Fixed",
    ruler: "Venus",
    essence: "the stabilizer, bringing patience and appreciation for life's sensual pleasures",
    traits: "reliable, patient, practical, devoted",
    shadow: "stubbornness, possessiveness, resistance to change"
  },
  Gemini: {
    element: "Air",
    quality: "Mutable",
    ruler: "Mercury",
    essence: "the communicator, bringing curiosity and connection to every interaction",
    traits: "adaptable, clever, witty, social",
    shadow: "inconsistency, superficiality, nervousness"
  },
  Cancer: {
    element: "Water",
    quality: "Cardinal",
    ruler: "Moon",
    essence: "the nurturer, bringing emotional depth and protective care to their world",
    traits: "intuitive, protective, sympathetic, tenacious",
    shadow: "moodiness, clinginess, indirect communication"
  },
  Leo: {
    element: "Fire",
    quality: "Fixed",
    ruler: "Sun",
    essence: "the performer, bringing warmth, creativity, and generous spirit to life",
    traits: "confident, dramatic, loyal, generous",
    shadow: "pride, attention-seeking, inflexibility"
  },
  Virgo: {
    element: "Earth",
    quality: "Mutable",
    ruler: "Mercury",
    essence: "the analyst, bringing precision and service-oriented dedication to all they do",
    traits: "analytical, helpful, observant, reliable",
    shadow: "criticism, worry, perfectionism"
  },
  Libra: {
    element: "Air",
    quality: "Cardinal",
    ruler: "Venus",
    essence: "the harmonizer, bringing balance, beauty, and fairness to relationships",
    traits: "diplomatic, graceful, idealistic, social",
    shadow: "indecision, people-pleasing, avoidance of conflict"
  },
  Scorpio: {
    element: "Water",
    quality: "Fixed",
    ruler: "Pluto",
    essence: "the transformer, bringing intensity and profound emotional depth",
    traits: "passionate, resourceful, determined, intuitive",
    shadow: "jealousy, secrecy, vindictiveness"
  },
  Sagittarius: {
    element: "Fire",
    quality: "Mutable",
    ruler: "Jupiter",
    essence: "the explorer, bringing optimism and philosophical wisdom to their adventures",
    traits: "optimistic, adventurous, honest, philosophical",
    shadow: "tactlessness, restlessness, overconfidence"
  },
  Capricorn: {
    element: "Earth",
    quality: "Cardinal",
    ruler: "Saturn",
    essence: "the achiever, bringing discipline and ambition to climb any mountain",
    traits: "responsible, disciplined, ambitious, patient",
    shadow: "pessimism, coldness, workaholism"
  },
  Aquarius: {
    element: "Air",
    quality: "Fixed",
    ruler: "Uranus",
    essence: "the visionary, bringing innovation and humanitarian ideals to society",
    traits: "progressive, original, independent, humanitarian",
    shadow: "detachment, rebelliousness, unpredictability"
  },
  Pisces: {
    element: "Water",
    quality: "Mutable",
    ruler: "Neptune",
    essence: "the mystic, bringing compassion and spiritual connection to earthly existence",
    traits: "compassionate, artistic, intuitive, gentle",
    shadow: "escapism, victimhood, boundary issues"
  }
};

const CHINESE_ZODIAC_DATA = {
  Rat: {
    traits: "quick-witted, resourceful, versatile",
    strengths: "adaptability, charm, sharp instincts",
    compatible: "Dragon, Monkey, Ox",
    element_nature: "Water yang - flowing intelligence"
  },
  Ox: {
    traits: "diligent, dependable, strong",
    strengths: "patience, reliability, methodical approach",
    compatible: "Rat, Snake, Rooster",
    element_nature: "Earth yin - grounded strength"
  },
  Tiger: {
    traits: "brave, competitive, unpredictable",
    strengths: "courage, passion, natural leadership",
    compatible: "Dragon, Horse, Pig",
    element_nature: "Wood yang - expansive power"
  },
  Rabbit: {
    traits: "gentle, elegant, alert",
    strengths: "diplomacy, artistic sense, intuition",
    compatible: "Goat, Monkey, Dog, Pig",
    element_nature: "Wood yin - graceful growth"
  },
  Dragon: {
    traits: "confident, intelligent, enthusiastic",
    strengths: "charisma, ambition, good fortune",
    compatible: "Rooster, Rat, Monkey",
    element_nature: "Earth yang - commanding presence"
  },
  Snake: {
    traits: "enigmatic, intelligent, wise",
    strengths: "intuition, elegance, analytical mind",
    compatible: "Dragon, Rooster",
    element_nature: "Fire yin - transformative wisdom"
  },
  Horse: {
    traits: "animated, active, energetic",
    strengths: "freedom-loving, quick thinking, warm-hearted",
    compatible: "Tiger, Goat, Rabbit",
    element_nature: "Fire yang - spirited movement"
  },
  Goat: {
    traits: "calm, gentle, sympathetic",
    strengths: "creativity, kindness, artistic talent",
    compatible: "Rabbit, Horse, Pig",
    element_nature: "Earth yin - nurturing creativity"
  },
  Monkey: {
    traits: "sharp, curious, mischievous",
    strengths: "cleverness, innovation, problem-solving",
    compatible: "Ox, Dragon, Rabbit",
    element_nature: "Metal yang - brilliant adaptability"
  },
  Rooster: {
    traits: "observant, hardworking, courageous",
    strengths: "honesty, confidence, punctuality",
    compatible: "Ox, Snake",
    element_nature: "Metal yin - precise integrity"
  },
  Dog: {
    traits: "loyal, honest, prudent",
    strengths: "faithfulness, reliability, sense of justice",
    compatible: "Rabbit",
    element_nature: "Earth yang - protective loyalty"
  },
  Pig: {
    traits: "compassionate, generous, diligent",
    strengths: "sincerity, tolerance, fortune",
    compatible: "Tiger, Rabbit, Goat",
    element_nature: "Water yin - abundant generosity"
  }
};

const PERSONAL_YEAR_DATA = {
  1: { theme: "New Beginnings", focus: "This is your year to plant seeds, start fresh projects, and assert your independence. The universe supports bold initiatives." },
  2: { theme: "Partnership & Patience", focus: "Relationships take center stage. This year rewards cooperation, diplomacy, and attention to details. Let things develop naturally." },
  3: { theme: "Creative Expression", focus: "Your creative energies are amplified. Express yourself through art, writing, or communication. Social opportunities abound." },
  4: { theme: "Building Foundations", focus: "Hard work and discipline are required. Build structures that will support your future. Focus on health, home, and practical matters." },
  5: { theme: "Change & Freedom", focus: "Expect the unexpected. Travel, new experiences, and major changes are likely. Embrace flexibility and avoid restrictions." },
  6: { theme: "Love & Responsibility", focus: "Family, home, and relationships demand attention. Service to others brings fulfillment. Beauty and harmony matter." },
  7: { theme: "Inner Journey", focus: "A year for reflection, study, and spiritual development. Solitude brings wisdom. Trust your intuition and seek deeper truths." },
  8: { theme: "Power & Achievement", focus: "Material success and recognition are possible. Business, finance, and career matters flourish with effort. Step into your authority." },
  9: { theme: "Completion & Release", focus: "A year of endings and letting go. Release what no longer serves you. Humanitarian concerns call. Prepare for a new cycle." },
  11: { theme: "Spiritual Awakening", focus: "Heightened intuition and spiritual insights. You may feel called to inspire others. Balance the practical with the visionary." },
  22: { theme: "Master Building", focus: "Potential for significant achievement on a large scale. Your practical efforts can have lasting impact. Think big, work methodically." },
  33: { theme: "Master Teaching", focus: "Your compassion and wisdom can uplift many. Focus on healing and nurturing. Lead through love and example." }
};

function generateLifeEssay(user) {
  const lifePath = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const sunSign = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const chineseZodiac = CHINESE_ZODIAC_DATA[user.chinese_zodiac] || CHINESE_ZODIAC_DATA['Rat'];
  const chineseElement = getChineseElement(user.birth_date);
  const personalYear = getPersonalYear(user.birth_date);
  const personalYearData = PERSONAL_YEAR_DATA[personalYear] || PERSONAL_YEAR_DATA[1];
  
  const birthDateFormatted = new Date(user.birth_date).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return `
═══════════════════════════════════════════════════════════════
                    THE COSMIC BLUEPRINT OF
                        ${(user.name || 'Cosmic Traveler').toUpperCase()}
═══════════════════════════════════════════════════════════════

                         ✧ Introduction ✧

You entered this world on ${birthDateFormatted}, at a precise moment when the cosmos aligned to create the unique energetic signature that is you. This essay explores the three great traditions of cosmic wisdom—Western Astrology, Numerology, and Chinese Astrology—and how they weave together to illuminate your path. What you'll find here is not a prediction of your fate, but a mirror reflecting the deeper patterns of your soul's journey.

                    ✧ Your Numerological Core ✧

At the heart of your numerological identity lies Life Path ${user.life_path}—${lifePath.essence}. This number was derived from the complete numerical sum of your birth date, reduced through the ancient practice of digit summing until it revealed this core vibration.

Those who walk Life Path ${user.life_path} carry the essence of being ${lifePath.traits}. Your soul chose this number before birth as the primary lesson and gift of this lifetime. Your purpose in this incarnation is ${lifePath.purpose}. This doesn't mean your path will be easy—in fact, the very challenges you face are designed to help you master these qualities.

The gifts you bring to the world include ${lifePath.gifts}. These aren't abilities you need to develop so much as remember—they are encoded in your cosmic DNA. Yet every gift casts a shadow. Your particular challenges involve ${lifePath.challenges}. These are not flaws to be ashamed of but edges where growth happens.

                    ✧ Your Solar Identity ✧

The Sun was moving through ${user.sun_sign} when you took your first breath, marking you as ${sunSign.essence}. In Western Astrology, the Sun sign represents your core identity—the central flame of who you are meant to become in this lifetime.

As a ${user.sun_sign}, you operate through the ${sunSign.element} element with ${sunSign.quality} energy, guided by the planetary influence of ${sunSign.ruler}. This combination makes you naturally ${sunSign.traits}. These are the qualities that shine through you when you are living authentically.

The shadow side of ${user.sun_sign} includes tendencies toward ${sunSign.shadow}. Understanding these shadows is not about self-judgment—it's about awareness. When you notice these patterns arising, they're signals that you've stepped away from your authentic solar expression and can consciously return.

                    ✧ Your Eastern Wisdom ✧

In the Chinese astrological tradition, you were born in the Year of the ${chineseElement} ${user.chinese_zodiac}. While Western astrology focuses on the month of your birth, Chinese astrology emphasizes the year—a different lens on the same cosmic truth.

The ${user.chinese_zodiac} carries the energy of being ${chineseZodiac.traits}. Your particular strengths include ${chineseZodiac.strengths}. The ${chineseElement} element that colors your ${user.chinese_zodiac} nature adds its own quality: ${chineseZodiac.element_nature}.

In relationships, the ${user.chinese_zodiac} traditionally finds harmony with ${chineseZodiac.compatible}. This doesn't mean other connections are impossible—it simply indicates where natural ease tends to flow.

                    ✧ The Synthesis ✧

What makes you unique is not any single cosmic influence, but the way they combine. You are simultaneously a Life Path ${user.life_path} ${lifePath.essence}, a ${user.sun_sign} with ${sunSign.element} fire and ${sunSign.quality} drive, and a ${chineseElement} ${user.chinese_zodiac} from the Eastern tradition.

Consider how these energies interact: The ${lifePath.traits.split(',')[0].trim()} nature of your Life Path ${user.life_path} meets the ${sunSign.traits.split(',')[0].trim()} quality of ${user.sun_sign}, all filtered through the ${chineseZodiac.traits.split(',')[0].trim()} wisdom of the ${user.chinese_zodiac}. This creates a cosmic fingerprint that belongs to you alone.

                    ✧ Your Current Cycle ✧

As of this year, you are moving through Personal Year ${personalYear}—a year of ${personalYearData.theme}. ${personalYearData.focus}

This cycle interacts with your core numbers in specific ways. For a Life Path ${user.life_path}, Personal Year ${personalYear} brings particular emphasis on how your ${lifePath.traits.split(',')[0].trim()} nature responds to the ${personalYearData.theme.toLowerCase()} energy now surrounding you.

                    ✧ Living Your Blueprint ✧

Your cosmic blueprint is not a cage but a map. It shows the terrain of your soul, the valleys and mountains you came here to explore. The ${lifePath.essence} within you will always seek ${lifePath.purpose.replace('to ', '')}. The ${user.sun_sign} Sun will always long for authentic ${sunSign.traits.split(',')[0].trim()} expression. The ${user.chinese_zodiac} will always carry its ${chineseZodiac.traits.split(',')[0].trim()} medicine.

The question is not whether these energies will express through you—they will. The question is whether you will express them consciously or unconsciously, by choice or by default.

                    ✧ Practical Wisdom ✧

Honor your Life Path ${user.life_path} by regularly engaging with activities that allow you to ${lifePath.purpose.replace('to ', '')}. This might look like taking on leadership roles if you're a 1, mediating conflicts as a 2, or creating art as a 3. Whatever your number, consciously choose experiences that exercise your core gifts.

For your ${user.sun_sign} nature, spend time in environments that support your ${sunSign.element} element. Fire signs thrive with movement and inspiration. Earth signs need tangible, sensory experiences. Air signs require mental stimulation and social connection. Water signs need emotional depth and creative flow.

To honor your ${user.chinese_zodiac} heritage, study the deeper traditions of Chinese metaphysics. The animal sign is just the beginning—the elements, the stems and branches, the flowing cycles of chi all offer wisdom for your journey.

                    ✧ Shadow Work ✧

Every cosmic gift has its shadow. For Life Path ${user.life_path}, watch for tendencies toward ${lifePath.challenges.split(',')[0].trim()}. For ${user.sun_sign}, be aware of ${sunSign.shadow.split(',')[0].trim()}. These patterns often emerge under stress or when you're not living authentically.

Shadow work is not about eliminating these tendencies but integrating them. The shadow holds rejected parts of yourself that, when reclaimed, become sources of power. Your challenges, when faced consciously, become your greatest teachers.

                    ✧ Relationships Through Your Lens ✧

Understanding your cosmic blueprint transforms how you relate to others. As a Life Path ${user.life_path}, you bring ${lifePath.gifts.split(',')[0].trim()} to your relationships. As a ${user.sun_sign}, you need partners who appreciate your ${sunSign.traits.split(',')[0].trim()} nature. As a ${user.chinese_zodiac}, you flow most naturally with ${chineseZodiac.compatible}.

Remember that every person has their own cosmic blueprint. The friction you feel with certain people isn't personal—it's energetic. And that friction can either grind you down or polish you into a brighter version of yourself, depending on how you approach it.

                    ✧ Career & Purpose ✧

Your vocation, in the deepest sense, is ${lifePath.purpose}. This doesn't dictate a specific career but illuminates the quality of contribution you're here to make. A Life Path ${user.life_path} might express through countless professions, but the ${lifePath.essence.toLowerCase()} energy will always be present when you're aligned.

Your ${user.sun_sign} nature suggests you thrive in environments that allow ${sunSign.traits.split(',')[0].trim()} expression, guided by ${sunSign.ruler}'s influence. The ${user.chinese_zodiac}'s ${chineseZodiac.strengths.split(',')[0].trim()} can be channeled into any field where these qualities are valued.

                    ✧ Spiritual Growth ✧

Each cosmic system points to the same ultimate truth: you are here to grow, to learn, to become more fully yourself. Life Path ${user.life_path} suggests your spiritual curriculum centers on ${lifePath.purpose.replace('to ', '')}. ${user.sun_sign} adds the dimension of ${sunSign.essence}. The ${user.chinese_zodiac} offers the Eastern perspective of ${chineseZodiac.element_nature}.

These are not separate lessons but facets of one diamond—your multidimensional self learning to shine in the world of form.

                    ✧ Closing Reflection ✧

You are ${user.name || 'a cosmic traveler'}—a Life Path ${user.life_path} ${lifePath.essence}, born under the ${user.sun_sign} Sun, carrying the ${chineseElement} ${user.chinese_zodiac}'s ancient wisdom. This combination has never existed before and will never exist again. You are a unique experiment of consciousness, a specific question the universe is asking through your existence.

The stars do not compel—they impel. They show tendencies, not certainties. What you do with your cosmic blueprint is your choice, your art, your gift to make. May this essay serve as a companion on your journey, a reminder of who you came here to be, and a map for the territory of your becoming.

═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Generated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generateYearEssay(user, year) {
  const personalYear = getPersonalYear(user.birth_date);
  const personalYearData = PERSONAL_YEAR_DATA[personalYear] || PERSONAL_YEAR_DATA[1];
  const lifePath = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const sunSign = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const moonPhase = getMoonPhase();

  return `
═══════════════════════════════════════════════════════════════
                    ${year} COSMIC FORECAST FOR
                        ${(user.name || 'Cosmic Traveler').toUpperCase()}
═══════════════════════════════════════════════════════════════

                    ✧ Your Personal Year: ${personalYear} ✧

${user.name || 'Dear Traveler'}, you are currently moving through Personal Year ${personalYear}—a year of ${personalYearData.theme}. In numerology, the Personal Year cycle spans nine years (plus master numbers), and each year carries its own distinct energy and invitation.

${personalYearData.focus}

For someone walking Life Path ${user.life_path} (${lifePath.essence}), this Personal Year ${personalYear} creates a specific dynamic. Your natural tendency toward being ${lifePath.traits.split(',')[0].trim()} now meets the ${personalYearData.theme.toLowerCase()} energy of this cycle. This can feel like acceleration if the energies align, or creative tension if they contrast—both are valuable.

                    ✧ Astrological Currents ✧

As a ${user.sun_sign}, you bring the ${sunSign.element} element and ${sunSign.quality} modality to this year's journey. The major planetary transits of ${year} will interact with your natal Sun position in ways that emphasize your ${sunSign.traits.split(',')[0].trim()} nature.

The eclipses of ${year} fall along axes that will highlight themes of transformation for all ${sunSign.element} signs. For ${user.sun_sign} specifically, this invites attention to how you balance ${sunSign.traits.split(',')[0].trim()} expression with growth edges around ${sunSign.shadow.split(',')[0].trim()}.

Saturn, the planet of structure and lessons, continues its journey through the zodiac, asking ${user.sun_sign} to mature in specific areas of life. Jupiter, planet of expansion and opportunity, offers blessings where you're willing to grow beyond current limitations.

                    ✧ Practical Navigation ✧

Given your Personal Year ${personalYear} and ${user.sun_sign} nature, here are key themes to work with:

The first quarter of ${year} (January-March) emphasizes ${personalYear <= 3 ? 'initiating new directions' : personalYear <= 6 ? 'building on existing foundations' : 'completing cycles and releasing'}. Your ${sunSign.element} element suggests working with ${sunSign.element === 'Fire' ? 'bold action and inspiration' : sunSign.element === 'Earth' ? 'practical steps and tangible results' : sunSign.element === 'Air' ? 'ideas, communication, and connection' : 'intuition, emotion, and creativity'}.

The middle of the year (April-August) brings the fullest expression of Personal Year ${personalYear} energy. This is when ${personalYearData.theme.toLowerCase()} themes reach their peak. As a Life Path ${user.life_path}, your natural gifts of ${lifePath.gifts.split(',')[0].trim()} can be particularly useful during this period.

The final quarter (September-December) begins the transition toward your next Personal Year (${personalYear === 9 || personalYear === 33 ? 1 : personalYear === 22 ? 1 : personalYear + 1}). Use this time to consolidate the year's lessons and prepare for the coming cycle's energy.

                    ✧ Monthly Rhythms ✧

Beyond the yearly cycle, pay attention to your Personal Month numbers (calculated by adding the current month to your Personal Year). These create a rhythm within the year—some months will feel more aligned with your nature, others more challenging.

The Moon's monthly journey through all twelve signs also affects you uniquely as a ${user.sun_sign}. When the Moon passes through ${user.sun_sign}, you'll feel more emotionally centered. When it opposes your sign, external circumstances may feel more demanding.

Currently, we're in the ${moonPhase.name}, a time of ${moonPhase.energy}. This cosmic rhythm continues regardless of your personal cycles, offering its own wisdom about timing and natural flow.

                    ✧ Closing Guidance ✧

${user.name || 'Dear Traveler'}, ${year} offers you specific opportunities aligned with Personal Year ${personalYear}'s theme of ${personalYearData.theme}. Your Life Path ${user.life_path} gives you the tools of ${lifePath.gifts.split(',')[0].trim()}, and your ${user.sun_sign} Sun provides the fuel of ${sunSign.traits.split(',')[0].trim()} energy.

The invitation this year is not to fight your nature but to express it more consciously. The cosmos doesn't ask you to be someone else—it asks you to become more fully yourself. ${personalYearData.focus.split('.')[0]}.

May this year bring you deeper into alignment with your cosmic blueprint, revealing new facets of who you came here to be.

═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Generated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generateReadingList(user) {
  const lifePath = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const sunSign = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const chineseZodiac = CHINESE_ZODIAC_DATA[user.chinese_zodiac] || CHINESE_ZODIAC_DATA['Rat'];

  const lifePathBooks = {
    1: [
      { title: "The Fountainhead", author: "Ayn Rand", reason: "Explores the power and challenges of radical individualism" },
      { title: "Man's Search for Meaning", author: "Viktor Frankl", reason: "Finding purpose through individual will and meaning-making" },
      { title: "The War of Art", author: "Steven Pressfield", reason: "Overcoming resistance to become the leader of your creative life" }
    ],
    2: [
      { title: "The Dance of Intimacy", author: "Harriet Lerner", reason: "Deepening your natural gift for relationships" },
      { title: "Nonviolent Communication", author: "Marshall Rosenberg", reason: "Mastering the art of connection you're built for" },
      { title: "The Highly Sensitive Person", author: "Elaine Aron", reason: "Understanding and honoring your sensitivity as a gift" }
    ],
    3: [
      { title: "Big Magic", author: "Elizabeth Gilbert", reason: "Embracing the creative life you're meant to live" },
      { title: "The Artist's Way", author: "Julia Cameron", reason: "Unblocking and channeling your natural creative flow" },
      { title: "Bird by Bird", author: "Anne Lamott", reason: "The joy and discipline of the creative expression you're here for" }
    ],
    4: [
      { title: "Atomic Habits", author: "James Clear", reason: "Building the systems and structures you naturally excel at" },
      { title: "The E-Myth Revisited", author: "Michael Gerber", reason: "Creating lasting foundations in work and business" },
      { title: "Deep Work", author: "Cal Newport", reason: "Honoring your need for focused, meaningful effort" }
    ],
    5: [
      { title: "The Art of Travel", author: "Alain de Botton", reason: "Philosophical exploration of the journeys you crave" },
      { title: "Vagabonding", author: "Rolf Potts", reason: "Embracing the freedom-seeking nature of your path" },
      { title: "The Alchemist", author: "Paulo Coelho", reason: "The spiritual dimension of adventure and personal legend" }
    ],
    6: [
      { title: "All About Love", author: "bell hooks", reason: "Deepening your understanding of love as practice and service" },
      { title: "The Gifts of Imperfection", author: "Brené Brown", reason: "Releasing perfectionism while honoring your caring nature" },
      { title: "Boundaries", author: "Henry Cloud", reason: "Protecting your giving heart with healthy limits" }
    ],
    7: [
      { title: "The Power of Now", author: "Eckhart Tolle", reason: "The spiritual awakening your soul seeks" },
      { title: "Siddhartha", author: "Hermann Hesse", reason: "The seeker's journey toward wisdom you're walking" },
      { title: "The Book of Secrets", author: "Osho", reason: "112 meditation techniques for your contemplative nature" }
    ],
    8: [
      { title: "Think and Grow Rich", author: "Napoleon Hill", reason: "Mastering the manifestation abilities you naturally possess" },
      { title: "The 48 Laws of Power", author: "Robert Greene", reason: "Understanding the power dynamics you're here to master" },
      { title: "Principles", author: "Ray Dalio", reason: "Building systems for the success you're capable of" }
    ],
    9: [
      { title: "A New Earth", author: "Eckhart Tolle", reason: "The evolution of consciousness you're here to embody" },
      { title: "The Prophet", author: "Kahlil Gibran", reason: "Universal wisdom that resonates with your humanitarian heart" },
      { title: "When Things Fall Apart", author: "Pema Chödrön", reason: "Finding wisdom in the endings and completions of your path" }
    ],
    11: [
      { title: "The Seat of the Soul", author: "Gary Zukav", reason: "Understanding the spiritual power you're here to channel" },
      { title: "Many Lives, Many Masters", author: "Brian Weiss", reason: "Exploring the intuitive realms you naturally access" },
      { title: "The Untethered Soul", author: "Michael Singer", reason: "Freedom for the visionary spirit within you" }
    ],
    22: [
      { title: "Good to Great", author: "Jim Collins", reason: "Building lasting institutions worthy of your master builder energy" },
      { title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", reason: "Practical wisdom for large-scale impact" },
      { title: "Mastery", author: "Robert Greene", reason: "The long game of becoming what you're meant to build" }
    ],
    33: [
      { title: "The Way of the Bodhisattva", author: "Shantideva", reason: "The path of compassionate service you're walking" },
      { title: "Letters to a Young Poet", author: "Rainer Maria Rilke", reason: "Wisdom for the teacher and healer within you" },
      { title: "The Book of Joy", author: "Dalai Lama & Desmond Tutu", reason: "Joy as spiritual practice for the nurturing master" }
    ]
  };

  const elementBooks = {
    Fire: [
      { title: "The Fire Starter Sessions", author: "Danielle LaPorte", reason: "Aligning your fiery nature with soul-centered goals" },
      { title: "Start with Why", author: "Simon Sinek", reason: "Fueling your natural enthusiasm with purpose" }
    ],
    Earth: [
      { title: "Essentialism", author: "Greg McKeown", reason: "Honoring your practical nature by focusing on what matters" },
      { title: "The Life-Changing Magic of Tidying Up", author: "Marie Kondo", reason: "Creating order in your physical world" }
    ],
    Air: [
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", reason: "Understanding the mind you naturally live in" },
      { title: "How to Win Friends and Influence People", author: "Dale Carnegie", reason: "Mastering the social connections you thrive on" }
    ],
    Water: [
      { title: "The Language of Emotions", author: "Karla McLaren", reason: "Understanding the emotional depths you navigate" },
      { title: "Women Who Run with the Wolves", author: "Clarissa Pinkola Estés", reason: "Connecting with the intuitive wilderness within" }
    ]
  };

  const chineseBooks = {
    Rat: { title: "The Art of Strategy", author: "Avinash Dixit", reason: "Strategic thinking for your clever nature" },
    Ox: { title: "Grit", author: "Angela Duckworth", reason: "The power of persistence you naturally embody" },
    Tiger: { title: "Daring Greatly", author: "Brené Brown", reason: "Courage and vulnerability for the brave Tiger" },
    Rabbit: { title: "Quiet", author: "Susan Cain", reason: "Honoring your gentle, intuitive nature" },
    Dragon: { title: "Ego is the Enemy", author: "Ryan Holiday", reason: "Balancing your natural confidence with wisdom" },
    Snake: { title: "Blink", author: "Malcolm Gladwell", reason: "Understanding the intuition you naturally trust" },
    Horse: { title: "Wild", author: "Cheryl Strayed", reason: "The freedom journey your spirit craves" },
    Goat: { title: "The Creative Habit", author: "Twyla Tharp", reason: "Nurturing your artistic soul" },
    Monkey: { title: "Lateral Thinking", author: "Edward de Bono", reason: "Innovative thinking for your clever mind" },
    Rooster: { title: "Getting Things Done", author: "David Allen", reason: "Productivity systems for your organized nature" },
    Dog: { title: "The Loyalty Effect", author: "Frederick Reichheld", reason: "Understanding the faithfulness you embody" },
    Pig: { title: "The How of Happiness", author: "Sonja Lyubomirsky", reason: "Cultivating the joy your generous heart deserves" }
  };

  const pathBooks = lifePathBooks[user.life_path] || lifePathBooks[1];
  const elemBooks = elementBooks[sunSign.element] || elementBooks['Fire'];
  const zodiacBook = chineseBooks[user.chinese_zodiac] || chineseBooks['Rat'];

  return `
═══════════════════════════════════════════════════════════════
                    PERSONALIZED READING LIST FOR
                        ${(user.name || 'Cosmic Traveler').toUpperCase()}
═══════════════════════════════════════════════════════════════

                    ✧ For Your Life Path ${user.life_path} ✧
                         (${lifePath.essence})

${pathBooks.map((book, i) => `
${i + 1}. "${book.title}" by ${book.author}
   Why this book: ${book.reason}
`).join('')}

                    ✧ For Your ${sunSign.element} Nature ✧
                         (${user.sun_sign})

${elemBooks.map((book, i) => `
${i + 1}. "${book.title}" by ${book.author}
   Why this book: ${book.reason}
`).join('')}

                    ✧ For Your ${user.chinese_zodiac} Spirit ✧

1. "${zodiacBook.title}" by ${zodiacBook.author}
   Why this book: ${zodiacBook.reason}

                    ✧ Universal Recommendations ✧

These books complement any cosmic blueprint:

1. "The Power of Myth" by Joseph Campbell
   Why this book: Understanding the archetypal patterns underlying all cosmic systems

2. "The Astrology of Fate" by Liz Greene
   Why this book: Deep psychological astrology that bridges ancient wisdom and modern insight

3. "The Complete Book of Chinese Astrology" by Shelly Wu
   Why this book: Exploring the rich tradition of your ${user.chinese_zodiac} heritage

                    ✧ How to Use This List ✧

This reading list is not meant to be rushed through but savored. Consider:

Start with the book that calls to you most strongly—your intuition knows what you need now. The books for your Life Path ${user.life_path} address your core soul curriculum. The ${sunSign.element} books honor your elemental nature. The ${user.chinese_zodiac} book connects you to Eastern wisdom.

You might read one book per month, or one per season. Let each book be a meditation, a conversation with the author's wisdom and your own cosmic blueprint.

Some books may challenge you—that's often where the growth lives. Some will feel like coming home—that's confirmation of who you already are.

                    ✧ Reading as Spiritual Practice ✧

For you, ${user.name || 'Cosmic Traveler'}, reading is more than entertainment. As a Life Path ${user.life_path}, you learn through ${lifePath.traits.split(',')[0].trim()} engagement with ideas. As a ${user.sun_sign}, your ${sunSign.element} nature processes information through ${sunSign.element === 'Fire' ? 'inspiration and action' : sunSign.element === 'Earth' ? 'practical application' : sunSign.element === 'Air' ? 'mental understanding and discussion' : 'emotional resonance and intuition'}.

Let these books be mirrors, teachers, and companions on your journey. The right book at the right time can change everything.

═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Curated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

// ============== SMS CONTENT GENERATION ==============

function generatePersonalizedSMS(user) {
  const moonPhase = getMoonPhase();
  
  const lifePathMessages = {
    1: ["Lead with courage today", "Your independence is your strength", "Initiate what matters to you", "Trust your pioneering spirit"],
    2: ["Trust your intuition deeply", "Partnerships bring blessings", "Your sensitivity is wisdom", "Diplomacy opens doors"],
    3: ["Express your creativity now", "Your words carry power today", "Joy is your birthright", "Share your light freely"],
    4: ["Build something meaningful", "Patience creates permanence", "Your discipline inspires others", "Trust the process"],
    5: ["Embrace today's changes", "Freedom awaits your choice", "Adventure calls to you", "Flexibility is strength"],
    6: ["Nurture what you love", "Home and heart align", "Service brings fulfillment", "Beauty surrounds you"],
    7: ["Seek the deeper truth", "Solitude brings answers", "Trust your inner wisdom", "Mystery reveals itself"],
    8: ["Step into your power", "Abundance flows to you", "Lead with integrity", "Success is manifesting"],
    9: ["Release what's complete", "Compassion transforms all", "Endings birth beginnings", "Serve the greater good"],
    11: ["Channel your vision now", "Inspiration flows through you", "Your intuition is heightened", "Illuminate the path"],
    22: ["Build your legacy today", "Dreams become reality", "Your work matters greatly", "Think big, act now"],
    33: ["Teach through love today", "Healing energy surrounds you", "Your compassion transforms", "Lead by example"]
  };

  const moonMessages = {
    'New Moon': ["Plant seeds of intention", "New beginnings welcome you", "Set your deepest intentions"],
    'Waxing Crescent': ["Nurture what you've started", "Growth is happening", "Keep tending your dreams"],
    'First Quarter': ["Push through resistance", "Action creates momentum", "Overcome today's challenges"],
    'Waxing Gibbous': ["Refine and adjust", "Trust the process", "Almost there—keep going"],
    'Full Moon': ["Receive what's revealed", "Illumination arrives", "Celebrate your progress"],
    'Waning Gibbous': ["Share your wisdom", "Gratitude multiplies blessings", "Give back generously"],
    'Last Quarter': ["Release what's heavy", "Let go gracefully", "Make space for new"],
    'Waning Crescent': ["Rest and surrender", "Dream deeply tonight", "Prepare for renewal"]
  };

  const pathMsgs = lifePathMessages[user.life_path] || lifePathMessages[1];
  const moonMsgs = moonMessages[moonPhase.name] || moonMessages['New Moon'];
  
  const pathMsg = pathMsgs[Math.floor(Math.random() * pathMsgs.length)];
  const moonMsg = moonMsgs[Math.floor(Math.random() * moonMsgs.length)];

  return `${moonPhase.icon} ${user.name || 'Cosmic traveler'}, the ${moonPhase.name} whispers: ${moonMsg}. As Life Path ${user.life_path}, ${pathMsg.toLowerCase()}. ✧ Cosmic Self`;
}

function getCurrentCosmicWeather() {
  const moonPhase = getMoonPhase();
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Approximate sun sign based on current date
  const signs = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];
  
  let currentSunSign = 'Capricorn';
  for (let sign of signs) {
    if ((month === sign.start[0] && day >= sign.start[1]) ||
        (month === sign.end[0] && day <= sign.end[1])) {
      currentSunSign = sign.name;
      break;
    }
  }

  return {
    moonPhase,
    sunSign: currentSunSign,
    guidance: `The ${moonPhase.name} invites ${moonPhase.energy}. The Sun in ${currentSunSign} colors the day with its qualities. Honor both rhythms.`
  };
}

// ============== SCHEDULED SMS ==============

if (twilioClient) {
  // Send SMS 3x per week (Mon, Wed, Fri at 8am)
  cron.schedule('0 8 * * 1,3,5', async () => {
    console.log('Running scheduled SMS send...');
    
    try {
      const subscribers = await pool.query(
        "SELECT * FROM users WHERE subscription_tier = 'sms' AND phone IS NOT NULL"
      );
      
      for (const user of subscribers.rows) {
        const message = generatePersonalizedSMS(user);
        
        try {
          await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phone
          });
          
          await pool.query(
            'INSERT INTO sms_log (user_id, message, sent_at) VALUES ($1, $2, NOW())',
            [user.id, message]
          );
          
          console.log(`SMS sent to user ${user.id}`);
        } catch (smsError) {
          console.error(`Failed to send SMS to user ${user.id}:`, smsError);
        }
      }
    } catch (error) {
      console.error('Scheduled SMS error:', error);
    }
  });
  
  console.log('✧ SMS scheduler initialized (Mon/Wed/Fri 8am) ✧');
}

// ============== SERVE FRONTEND ==============

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============== START SERVER ==============

app.listen(PORT, () => {
  console.log(`✧ Cosmic Self running on port ${PORT} ✧`);
});
