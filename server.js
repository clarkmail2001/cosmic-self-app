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
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { xForwardedForHeader: false }
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
// Admin reset - delete existing account to re-register (TEMPORARY)
app.post('/api/auth/admin-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    res.json({ success: true, message: 'Account deleted. You can now re-register.' });
  } catch (error) {
    console.error('Admin reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
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
    
    // Check if admin email - grant all access
    const isAdmin = ADMIN_EMAILS.includes(email);
    
    const result = await pool.query(
      `INSERT INTO users (email, password, name, birth_date, birth_time, birth_place, phone, life_path, sun_sign, chinese_zodiac, has_life_essay, has_year_essay, has_reading_list)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, email, name, life_path, sun_sign, chinese_zodiac, has_life_essay, has_year_essay, has_reading_list, subscription_tier`,
      [email, hashedPassword, name, birthDate, birthTime || null, birthPlace || null, phone || null, lifePath, sunSign, chineseZodiac, isAdmin, isAdmin, isAdmin]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET || 'cosmic-secret-key');
    
    res.json({ 
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        life_path: result.rows[0].life_path,
        sun_sign: result.rows[0].sun_sign,
        chinese_zodiac: result.rows[0].chinese_zodiac,
        has_life_essay: result.rows[0].has_life_essay,
        has_year_essay: result.rows[0].has_year_essay,
        has_reading_list: result.rows[0].has_reading_list,
        subscription_tier: result.rows[0].subscription_tier
      }, 
      token 
    });
    
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
    
    // Check if admin - ensure they have access to everything
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    if (isAdmin && (!user.has_life_essay || !user.has_year_essay || !user.has_reading_list)) {
      await pool.query(
        'UPDATE users SET has_life_essay = true, has_year_essay = true, has_reading_list = true WHERE id = $1',
        [user.id]
      );
      user.has_life_essay = true;
      user.has_year_essay = true;
      user.has_reading_list = true;
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'cosmic-secret-key');
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        life_path: user.life_path,
        sun_sign: user.sun_sign,
        chinese_zodiac: user.chinese_zodiac,
        has_life_essay: user.has_life_essay,
        has_year_essay: user.has_year_essay,
        has_reading_list: user.has_reading_list,
        subscription_tier: user.subscription_tier
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
    
    const user = result.rows[0];
    
    // Check if admin - ensure they have access to everything
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    if (isAdmin) {
      user.has_life_essay = true;
      user.has_year_essay = true;
      user.has_reading_list = true;
    }
    
    res.json(user);
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
    // Check if admin
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
            console.log(`SMS subscription activated for user ${userId}`);
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
    
    // Generate essay (we generate fresh each time for now, caching can be added later)
    const essay = generateLifeEssay(user);
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
    const essay = generateYearEssay(user, currentYear);
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
    
    const readingList = generateReadingList(user);
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

app.post('/api/sms/test', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    
    if (!user || !user.phone) {
      return res.status(400).json({ error: 'No phone number on file' });
    }
    
    if (!twilioClient) {
      return res.status(400).json({ error: 'SMS service not configured' });
    }
    
    const message = generatePersonalizedSMS(user);
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    
    res.json({ success: true, message: 'Test SMS sent' });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// ============== HELPER FUNCTIONS ==============

function calculateLifePath(birthDate) {
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length !== 3) return null;
  
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
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
  
  return 'Capricorn';
}

function getChineseZodiac(birthDate) {
  if (!birthDate) return null;
  const year = parseInt(birthDate.split('-')[0]);
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const index = (year - 1900) % 12;
  return animals[index >= 0 ? index : index + 12];
}

function getChineseElement(birthDate) {
  if (!birthDate) return 'Unknown';
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
  if (!birthDate) return 1;
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

// ============== CONTENT DATA ==============

const LIFE_PATH_DATA = {
  1: { essence: "The Pioneer", traits: "independent, ambitious, innovative", purpose: "to develop individuality and lead by example", challenges: "overcoming self-doubt, avoiding arrogance", gifts: "natural leadership, original thinking, courage" },
  2: { essence: "The Peacemaker", traits: "diplomatic, intuitive, cooperative", purpose: "to bring harmony and partnership into the world", challenges: "setting boundaries, trusting your judgment", gifts: "deep empathy, mediation skills, sensitivity" },
  3: { essence: "The Communicator", traits: "creative, expressive, optimistic", purpose: "to inspire others through creative self-expression", challenges: "avoiding scattered energy, channeling talents", gifts: "artistic ability, infectious joy, communication" },
  4: { essence: "The Builder", traits: "practical, disciplined, loyal", purpose: "to create lasting foundations and bring order", challenges: "avoiding rigidity, embracing change", gifts: "reliability, organization, determination" },
  5: { essence: "The Freedom Seeker", traits: "adventurous, versatile, curious", purpose: "to experience life fully and teach about freedom", challenges: "avoiding excess, developing commitment", gifts: "adaptability, magnetism, resourcefulness" },
  6: { essence: "The Nurturer", traits: "responsible, caring, protective", purpose: "to serve family and community through love", challenges: "avoiding martyrdom, setting healthy boundaries", gifts: "unconditional love, healing presence, harmony" },
  7: { essence: "The Seeker", traits: "analytical, introspective, spiritual", purpose: "to seek truth and share wisdom with the world", challenges: "avoiding isolation, trusting intuition", gifts: "profound insight, research abilities, wisdom" },
  8: { essence: "The Powerhouse", traits: "ambitious, authoritative, efficient", purpose: "to achieve material mastery and use power wisely", challenges: "balancing material and spiritual", gifts: "business acumen, manifestation, leadership" },
  9: { essence: "The Humanitarian", traits: "compassionate, generous, idealistic", purpose: "to serve humanity and bring cycles to completion", challenges: "letting go of the past, accepting endings", gifts: "universal love, artistic talent, wisdom" },
  11: { essence: "The Intuitive Illuminator", traits: "visionary, inspirational, sensitive", purpose: "to channel higher wisdom and inspire awakening", challenges: "grounding visions, managing sensitivity", gifts: "psychic ability, inspiration, spiritual insight" },
  22: { essence: "The Master Builder", traits: "visionary, practical, powerful", purpose: "to turn dreams into reality for humanity's benefit", challenges: "enormous pressure, patience", gifts: "manifesting large-scale visions, practical idealism" },
  33: { essence: "The Master Teacher", traits: "selfless, nurturing, wise", purpose: "to uplift humanity through unconditional love", challenges: "self-sacrifice, maintaining boundaries", gifts: "profound healing, spiritual leadership, compassion" }
};

const SUN_SIGN_DATA = {
  Aries: { element: "Fire", traits: "bold, direct, competitive", shadow: "impatience, aggression" },
  Taurus: { element: "Earth", traits: "reliable, patient, practical", shadow: "stubbornness, possessiveness" },
  Gemini: { element: "Air", traits: "adaptable, clever, curious", shadow: "inconsistency, superficiality" },
  Cancer: { element: "Water", traits: "intuitive, protective, nurturing", shadow: "moodiness, clinginess" },
  Leo: { element: "Fire", traits: "confident, dramatic, generous", shadow: "pride, attention-seeking" },
  Virgo: { element: "Earth", traits: "analytical, helpful, precise", shadow: "criticism, perfectionism" },
  Libra: { element: "Air", traits: "diplomatic, graceful, fair", shadow: "indecision, people-pleasing" },
  Scorpio: { element: "Water", traits: "passionate, determined, intuitive", shadow: "jealousy, secrecy" },
  Sagittarius: { element: "Fire", traits: "optimistic, adventurous, honest", shadow: "tactlessness, restlessness" },
  Capricorn: { element: "Earth", traits: "responsible, disciplined, ambitious", shadow: "pessimism, coldness" },
  Aquarius: { element: "Air", traits: "progressive, original, independent", shadow: "detachment, rebellion" },
  Pisces: { element: "Water", traits: "compassionate, artistic, intuitive", shadow: "escapism, victimhood" }
};

const CHINESE_ZODIAC_DATA = {
  Rat: { traits: "quick-witted, resourceful", strengths: "adaptability, charm", compatible: "Dragon, Monkey, Ox" },
  Ox: { traits: "diligent, dependable", strengths: "patience, reliability", compatible: "Rat, Snake, Rooster" },
  Tiger: { traits: "brave, competitive", strengths: "courage, leadership", compatible: "Dragon, Horse, Pig" },
  Rabbit: { traits: "gentle, elegant", strengths: "diplomacy, intuition", compatible: "Goat, Monkey, Dog, Pig" },
  Dragon: { traits: "confident, intelligent", strengths: "charisma, ambition", compatible: "Rooster, Rat, Monkey" },
  Snake: { traits: "enigmatic, wise", strengths: "intuition, elegance", compatible: "Dragon, Rooster" },
  Horse: { traits: "animated, energetic", strengths: "freedom-loving, warm", compatible: "Tiger, Goat, Rabbit" },
  Goat: { traits: "calm, gentle", strengths: "creativity, kindness", compatible: "Rabbit, Horse, Pig" },
  Monkey: { traits: "sharp, curious", strengths: "cleverness, innovation", compatible: "Ox, Dragon, Rabbit" },
  Rooster: { traits: "observant, hardworking", strengths: "honesty, confidence", compatible: "Ox, Snake" },
  Dog: { traits: "loyal, honest", strengths: "faithfulness, justice", compatible: "Rabbit" },
  Pig: { traits: "compassionate, generous", strengths: "sincerity, tolerance", compatible: "Tiger, Rabbit, Goat" }
};

const PERSONAL_YEAR_DATA = {
  1: { theme: "New Beginnings", focus: "Plant seeds, start fresh projects, assert independence." },
  2: { theme: "Partnership & Patience", focus: "Relationships matter. Cooperate, be patient, attend to details." },
  3: { theme: "Creative Expression", focus: "Express yourself creatively. Social opportunities abound." },
  4: { theme: "Building Foundations", focus: "Hard work required. Build structures for your future." },
  5: { theme: "Change & Freedom", focus: "Expect the unexpected. Embrace flexibility and adventure." },
  6: { theme: "Love & Responsibility", focus: "Family and relationships demand attention. Create harmony." },
  7: { theme: "Inner Journey", focus: "Reflect, study, develop spiritually. Trust your intuition." },
  8: { theme: "Power & Achievement", focus: "Material success possible. Step into your authority." },
  9: { theme: "Completion & Release", focus: "Let go of what no longer serves. Prepare for new cycle." },
  11: { theme: "Spiritual Awakening", focus: "Heightened intuition. Balance practical with visionary." },
  22: { theme: "Master Building", focus: "Large-scale achievement potential. Think big, work methodically." },
  33: { theme: "Master Teaching", focus: "Compassion and wisdom uplift many. Lead through love." }
};

// ============== CONTENT GENERATION ==============

function generateLifeEssay(user) {
  const lifePath = LIFE_PATH_DATA[user.life_path] || LIFE_PATH_DATA[1];
  const sunSign = SUN_SIGN_DATA[user.sun_sign] || SUN_SIGN_DATA['Aries'];
  const chineseZodiac = CHINESE_ZODIAC_DATA[user.chinese_zodiac] || CHINESE_ZODIAC_DATA['Rat'];
  const chineseElement = getChineseElement(user.birth_date);
  const personalYear = getPersonalYear(user.birth_date);
  const personalYearData = PERSONAL_YEAR_DATA[personalYear] || PERSONAL_YEAR_DATA[1];
  
  const birthDate = user.birth_date ? new Date(user.birth_date).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'your birth date';

  return `
═══════════════════════════════════════════════════════════════
                    THE COSMIC BLUEPRINT OF
                        ${(user.name || 'Cosmic Traveler').toUpperCase()}
═══════════════════════════════════════════════════════════════

                         ✧ Introduction ✧

You entered this world on ${birthDate}, at a precise moment when the cosmos aligned to create the unique energetic signature that is you. This essay explores the three great traditions of cosmic wisdom—Western Astrology, Numerology, and Chinese Astrology—and how they weave together to illuminate your path.

                    ✧ Your Numerological Core ✧

At the heart of your numerological identity lies Life Path ${user.life_path || 'Unknown'}—${lifePath.essence}. This number was derived from your complete birth date, reduced through the ancient practice of digit summing.

Those who walk Life Path ${user.life_path || 'this path'} carry the essence of being ${lifePath.traits}. Your soul chose this number as the primary lesson and gift of this lifetime. Your purpose is ${lifePath.purpose}.

The gifts you bring include ${lifePath.gifts}. These aren't abilities you need to develop—they are encoded in your cosmic DNA. Your challenges involve ${lifePath.challenges}. These are not flaws but edges where growth happens.

                    ✧ Your Solar Identity ✧

The Sun was moving through ${user.sun_sign || 'Unknown'} when you took your first breath, marking you as a ${sunSign.element} sign with the qualities of being ${sunSign.traits}.

In Western Astrology, the Sun sign represents your core identity—the central flame of who you are meant to become. The shadow side includes tendencies toward ${sunSign.shadow}. Understanding these shadows brings awareness and growth.

                    ✧ Your Eastern Wisdom ✧

In Chinese astrology, you were born in the Year of the ${chineseElement} ${user.chinese_zodiac || 'Unknown'}. The ${user.chinese_zodiac || 'Unknown'} carries the energy of being ${chineseZodiac.traits}.

Your particular strengths include ${chineseZodiac.strengths}. In relationships, the ${user.chinese_zodiac || 'Unknown'} traditionally finds harmony with ${chineseZodiac.compatible}.

                    ✧ The Synthesis ✧

What makes you unique is not any single cosmic influence, but how they combine. You are simultaneously a Life Path ${user.life_path || 'Unknown'} ${lifePath.essence}, a ${user.sun_sign || 'Unknown'} with ${sunSign.element} energy, and a ${chineseElement} ${user.chinese_zodiac || 'Unknown'} from the Eastern tradition.

This creates a cosmic fingerprint that belongs to you alone.

                    ✧ Your Current Cycle ✧

As of this year, you are moving through Personal Year ${personalYear}—a year of ${personalYearData.theme}. ${personalYearData.focus}

                    ✧ Living Your Blueprint ✧

Your cosmic blueprint is not a cage but a map. It shows the terrain of your soul. The ${lifePath.essence} within you will always seek to ${lifePath.purpose}. The ${user.sun_sign || 'Unknown'} Sun will always express through ${sunSign.traits.split(',')[0]} energy.

The question is not whether these energies will express through you—they will. The question is whether you will express them consciously or unconsciously.

                    ✧ Practical Wisdom ✧

Honor your Life Path ${user.life_path || 'Unknown'} by engaging with activities that allow you to ${lifePath.purpose}. For your ${user.sun_sign || 'Unknown'} nature, spend time in environments that support your ${sunSign.element} element.

                    ✧ Closing Reflection ✧

You are ${user.name || 'a cosmic traveler'}—a Life Path ${user.life_path || 'Unknown'} ${lifePath.essence}, born under the ${user.sun_sign || 'Unknown'} Sun, carrying the ${chineseElement} ${user.chinese_zodiac || 'Unknown'}'s ancient wisdom.

This combination has never existed before and will never exist again. You are a unique experiment of consciousness.

The stars do not compel—they impel. What you do with your cosmic blueprint is your choice, your art, your gift to make.

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

${user.name || 'Dear Traveler'}, you are moving through Personal Year ${personalYear}—a year of ${personalYearData.theme}.

${personalYearData.focus}

For someone walking Life Path ${user.life_path || 'Unknown'} (${lifePath.essence}), this Personal Year creates a specific dynamic. Your natural tendency toward being ${lifePath.traits.split(',')[0]} now meets the ${personalYearData.theme.toLowerCase()} energy.

                    ✧ Astrological Currents ✧

As a ${user.sun_sign || 'Unknown'}, you bring ${sunSign.element} element energy to this year's journey. This invites attention to how you balance ${sunSign.traits.split(',')[0]} expression with growth.

                    ✧ Practical Navigation ✧

The first quarter of ${year} emphasizes ${personalYear <= 3 ? 'initiating new directions' : personalYear <= 6 ? 'building on foundations' : 'completing cycles'}.

The middle of the year brings the fullest expression of Personal Year ${personalYear} energy—when ${personalYearData.theme.toLowerCase()} themes reach their peak.

The final quarter begins the transition toward your next Personal Year. Use this time to consolidate lessons and prepare for the coming cycle.

                    ✧ Monthly Rhythms ✧

Currently, we're in the ${moonPhase.name}, a time of ${moonPhase.energy}. This cosmic rhythm offers wisdom about timing and natural flow.

                    ✧ Closing Guidance ✧

${year} offers you opportunities aligned with Personal Year ${personalYear}'s theme of ${personalYearData.theme}. Your Life Path ${user.life_path || 'Unknown'} gives you the tools of ${lifePath.gifts.split(',')[0]}.

May this year bring you deeper into alignment with your cosmic blueprint.

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

  const lifePathBooks = {
    1: ['"The War of Art" by Steven Pressfield', '"Man\'s Search for Meaning" by Viktor Frankl'],
    2: ['"The Dance of Intimacy" by Harriet Lerner', '"Nonviolent Communication" by Marshall Rosenberg'],
    3: ['"Big Magic" by Elizabeth Gilbert', '"The Artist\'s Way" by Julia Cameron'],
    4: ['"Atomic Habits" by James Clear', '"Deep Work" by Cal Newport'],
    5: ['"The Alchemist" by Paulo Coelho', '"Vagabonding" by Rolf Potts'],
    6: ['"All About Love" by bell hooks', '"Boundaries" by Henry Cloud'],
    7: ['"The Power of Now" by Eckhart Tolle', '"Siddhartha" by Hermann Hesse'],
    8: ['"Think and Grow Rich" by Napoleon Hill', '"Principles" by Ray Dalio'],
    9: ['"A New Earth" by Eckhart Tolle', '"The Prophet" by Kahlil Gibran'],
    11: ['"The Seat of the Soul" by Gary Zukav', '"Many Lives, Many Masters" by Brian Weiss'],
    22: ['"Good to Great" by Jim Collins', '"Mastery" by Robert Greene'],
    33: ['"The Book of Joy" by Dalai Lama', '"Letters to a Young Poet" by Rilke']
  };

  const elementBooks = {
    Fire: '"Start with Why" by Simon Sinek - fueling your natural enthusiasm',
    Earth: '"Essentialism" by Greg McKeown - honoring your practical nature',
    Air: '"Thinking, Fast and Slow" by Daniel Kahneman - understanding your mind',
    Water: '"The Language of Emotions" by Karla McLaren - navigating emotional depths'
  };

  const books = lifePathBooks[user.life_path] || lifePathBooks[1];

  return `
═══════════════════════════════════════════════════════════════
                    PERSONALIZED READING LIST FOR
                        ${(user.name || 'Cosmic Traveler').toUpperCase()}
═══════════════════════════════════════════════════════════════

                    ✧ For Your Life Path ${user.life_path || 'Unknown'} ✧
                         (${lifePath.essence})

${books.join('\n')}

These books resonate with your ${lifePath.traits} nature and support your purpose: ${lifePath.purpose}.

                    ✧ For Your ${sunSign.element} Nature ✧
                         (${user.sun_sign || 'Unknown'})

${elementBooks[sunSign.element] || elementBooks['Fire']}

                    ✧ Universal Recommendations ✧

"The Power of Myth" by Joseph Campbell - Understanding archetypal patterns

"The Astrology of Fate" by Liz Greene - Deep psychological astrology

                    ✧ How to Use This List ✧

Start with the book that calls to you most strongly—your intuition knows what you need now. Let each book be a meditation, a conversation with the author's wisdom and your own cosmic blueprint.

═══════════════════════════════════════════════════════════════
                         ✧ ✧ ✧
              Curated with intention by Cosmic Self
              An All Walks of Life Production
═══════════════════════════════════════════════════════════════
`.trim();
}

function generatePersonalizedSMS(user) {
  const moonPhase = getMoonPhase();
  
  const lifePathMessages = {
    1: "Lead with courage today",
    2: "Trust your intuition deeply",
    3: "Express your creativity now",
    4: "Build something meaningful",
    5: "Embrace today's changes",
    6: "Nurture what you love",
    7: "Seek the deeper truth",
    8: "Step into your power",
    9: "Release what's complete",
    11: "Channel your vision now",
    22: "Build your legacy today",
    33: "Teach through love today"
  };

  const moonMessages = {
    'New Moon': "Plant seeds of intention",
    'Waxing Crescent': "Nurture what you've started",
    'First Quarter': "Push through resistance",
    'Waxing Gibbous': "Refine and adjust",
    'Full Moon': "Receive what's revealed",
    'Waning Gibbous': "Share your wisdom",
    'Last Quarter': "Release what's heavy",
    'Waning Crescent': "Rest and surrender"
  };

  const pathMsg = lifePathMessages[user.life_path] || lifePathMessages[1];
  const moonMsg = moonMessages[moonPhase.name] || "Honor the cosmic rhythm";

  return `${moonPhase.icon} ${user.name || 'Cosmic traveler'}, the ${moonPhase.name} whispers: ${moonMsg}. As Life Path ${user.life_path || 'Unknown'}, ${pathMsg.toLowerCase()}. ✧ Cosmic Self`;
}

function getCurrentCosmicWeather() {
  const moonPhase = getMoonPhase();
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  let currentSunSign = 'Capricorn';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) currentSunSign = 'Aries';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) currentSunSign = 'Taurus';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) currentSunSign = 'Gemini';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) currentSunSign = 'Cancer';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) currentSunSign = 'Leo';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) currentSunSign = 'Virgo';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) currentSunSign = 'Libra';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) currentSunSign = 'Scorpio';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) currentSunSign = 'Sagittarius';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) currentSunSign = 'Capricorn';
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) currentSunSign = 'Aquarius';
  else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) currentSunSign = 'Pisces';

  return {
    moonPhase,
    sunSign: currentSunSign,
    guidance: `The ${moonPhase.name} invites ${moonPhase.energy}. The Sun in ${currentSunSign} colors the day. Honor both rhythms.`
  };
}

// ============== SCHEDULED SMS ==============

if (twilioClient) {
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
  
  console.log('SMS scheduler initialized (Mon/Wed/Fri 8am)');
}

// ============== SERVE FRONTEND ==============

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============== START SERVER ==============

app.listen(PORT, () => {
  console.log(`Cosmic Self running on port ${PORT}`);
});
