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

// Load content + essay generators
// (data in cosmic-content.js, logic in cosmic-essays.js)
const {
  calculateLifePath,
  getSunSign,
  getChineseZodiac,
  getChineseElement,
  getMoonPhase,
  getPersonalYear,
  generateLifeEssay,
  generateYearEssay,
  generateReadingList,
  generatePersonalizedSMS,
  getCurrentCosmicWeather
} = require('./cosmic-essays');

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
