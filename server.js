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
    contentSecurityPolicy: false // Allow inline scripts for our app
}));
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
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
        
        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Calculate life path and sun sign
        const lifePath = calculateLifePath(birthDate);
        const sunSign = getSunSign(birthDate);
        const chineseZodiac = getChineseZodiac(birthDate);
        
        // Insert user
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
                subscription: user.subscription_tier
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
            'SELECT id, email, name, birth_date, birth_time, birth_place, life_path, sun_sign, chinese_zodiac, subscription_tier, created_at FROM users WHERE id = $1',
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

// Create checkout session for products (Year Essay, Reading List, Life Essay, SMS)
app.post('/api/create-checkout-session', async (req, res) => {
        try {
                const { priceId, productType, productName, userData } = req.body;
                        
                                // Product configurations
                                        const products = {
                                                    yearEssay: { amount: 500, name: 'Year Essay', description: '5 paragraphs of personalized year guidance' },
                                                                readingList: { amount: 500, name: 'Reading List', description: 'Personalized cosmic reading recommendations' },
                                                                            lifeEssay: { amount: 1500, name: 'Life Essay', description: '15 paragraphs of lifelong cosmic analysis' },
                                                                                        cosmicSMS: { amount: 1000, name: 'Cosmic SMS', description: '3 weekly texts + monthly paragraph', recurring: true }
                                                                                                };
                                                                                                        
                                                                                                                const product = products[priceId] || products.yearEssay;
                                                                                                                        
                                                                                                                                const sessionConfig = {
                                                                                                                                            payment_method_types: ['card'],
                                                                                                                                                        line_items: [{
                                                                                                                                                                        price_data: {
                                                                                                                                                                                            currency: 'usd',
                                                                                                                                                                                                                product_data: {
                                                                                                                                                                                                                                        name: product.name,
                                                                                                                                                                                                                                                                description: product.description
                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                        unit_amount: product.amount,
                                                                                                                                                                                                                                                                                                                            ...(product.recurring && { recurring: { interval: 'month' } })
                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                            quantity: 1
                                                                                                                                                                                                                                                                                                                                                                        }],
                                                                                                                                                                                                                                                                                                                                                                                    mode: product.recurring ? 'subscription' : 'payment',
                                                                                                                                                                                                                                                                                                                                                                                                success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=${priceId}`,
                                                                                                                                                                                                                                                                                                                                                                                                            cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/#pricing`,
                                                                                                                                                                                                                                                                                                                                                                                                                        metadata: {
                                                                                                                                                                                                                                                                                                                                                                                                                                        productName: product.name,
                                                                                                                                                                                                                                                                                                                                                                                                                                                        userName: userData?.name || '',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        birthDate: userData?.birthDate || '',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        birthTime: userData?.birthTime || 'not provided',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        birthLocation: userData?.birthLocation || 'not provided'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            };
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const session = await stripe.checkout.sessions.create(sessionConfig);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    res.json({ id: session.id });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                console.error('Checkout session error:', error);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        res.status(500).json({ error: 'Failed to create checkout session' });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
}

// Create donation checkout session
app.post('/api/stripe/donate', async (req, res) => {
    try {
        const { amount } = req.body; // amount in cents
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Support Cosmic Self',
                        description: 'Thank you for supporting our mission to help people understand their cosmic blueprint.'
                    },
                    unit_amount: amount || 500, // Default $5
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

// Purchase Life Essay ($5 one-time)
app.post('/api/stripe/life-essay', authenticateToken, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Personalized Life Essay',
                        description: 'A deep, personalized written analysis of your cosmic blueprint - your life path, planetary influences, and guidance for your journey.'
                    },
                    unit_amount: 500, // $5
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: {
                userId: req.user.id,
                type: 'life_essay'
            },
            success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/success?type=essay`,
            cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/pricing`,
        });
        
        res.json({ url: session.url });
    } catch (error) {
        console.error('Life essay purchase error:', error);
        res.status(500).json({ error: 'Failed to create purchase session' });
    }
});

// Subscribe to SMS ($10/month)
app.post('/api/stripe/subscribe-sms', authenticateToken, async (req, res) => {
    try {
        // First create or get the price
        let price;
        const prices = await stripe.prices.list({ lookup_keys: ['cosmic_sms_monthly'] });
        
        if (prices.data.length > 0) {
            price = prices.data[0];
        } else {
            // Create product and price if doesn't exist
            const product = await stripe.products.create({
                name: 'Cosmic SMS Guidance',
                description: '3x weekly personalized cosmic guidance texts as the moon moves through the zodiac'
            });
            
            price = await stripe.prices.create({
                product: product.id,
                unit_amount: 1000, // $10
                currency: 'usd',
                recurring: { interval: 'month' },
                lookup_key: 'cosmic_sms_monthly'
            });
        }
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: price.id, quantity: 1 }],
            mode: 'subscription',
            metadata: {
                userId: req.user.id,
                type: 'sms_subscription'
            },
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
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            
            if (session.metadata?.type === 'life_essay') {
                // Mark user as having purchased essay
                await pool.query(
                    'UPDATE users SET has_life_essay = true WHERE id = $1',
                    [session.metadata.userId]
                );
                // TODO: Trigger essay generation
            } else if (session.metadata?.type === 'sms_subscription') {
                // Update user subscription
                await pool.query(
                    'UPDATE users SET subscription_tier = $1, stripe_customer_id = $2 WHERE id = $3',
                    ['sms', session.customer, session.metadata.userId]
                );
            }
            break;
            
        case 'customer.subscription.deleted':
            // Handle cancellation
            const subscription = event.data.object;
            await pool.query(
                'UPDATE users SET subscription_tier = $1 WHERE stripe_customer_id = $2',
                ['free', subscription.customer]
            );
            break;
    }
    
    res.json({ received: true });
});

// ============== SMS ROUTES ==============

// Update phone number
app.post('/api/user/phone', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.body;
        
        await pool.query(
            'UPDATE users SET phone = $1 WHERE id = $2',
            [phone, req.user.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Phone update error:', error);
        res.status(500).json({ error: 'Failed to update phone' });
    }
});

// Send test SMS (for development)
app.post('/api/sms/test', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        
        if (!user.rows[0].phone) {
            return res.status(400).json({ error: 'No phone number on file' });
        }
        
        if (!twilioClient) {
            return res.status(400).json({ error: 'SMS service not configured' });
        }
        
        const message = generatePersonalizedMessage(user.rows[0]);
        
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

// ============== READING ROUTES ==============

// Generate life essay
app.get('/api/reading/life-essay', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        
        if (!user.rows[0].has_life_essay) {
            return res.status(403).json({ error: 'Life essay not purchased' });
        }
        
        const essay = generateLifeEssay(user.rows[0]);
        res.json({ essay });
    } catch (error) {
        console.error('Life essay error:', error);
        res.status(500).json({ error: 'Failed to generate essay' });
    }
});

// Get current cosmic weather
app.get('/api/reading/cosmic-weather', (req, res) => {
    const weather = getCurrentCosmicWeather();
    res.json(weather);
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

function getMoonPhase() {
    const synodicMonth = 29.53058867;
    const knownNewMoon = new Date('2024-01-11').getTime();
    const now = new Date().getTime();
    const diff = now - knownNewMoon;
    const days = diff / (1000 * 60 * 60 * 24);
    const phase = ((days % synodicMonth) + synodicMonth) % synodicMonth;
    
    if (phase < 1.85) return { name: 'New Moon', energy: 'beginnings' };
    if (phase < 7.38) return { name: 'Waxing Crescent', energy: 'intention' };
    if (phase < 9.23) return { name: 'First Quarter', energy: 'action' };
    if (phase < 14.77) return { name: 'Waxing Gibbous', energy: 'refinement' };
    if (phase < 16.61) return { name: 'Full Moon', energy: 'illumination' };
    if (phase < 22.15) return { name: 'Waning Gibbous', energy: 'gratitude' };
    if (phase < 24.00) return { name: 'Last Quarter', energy: 'release' };
    return { name: 'Waning Crescent', energy: 'surrender' };
}

function generatePersonalizedMessage(user) {
    const moonPhase = getMoonPhase();
    const lifePathMessages = {
        1: "Lead with courage today",
        2: "Trust your intuition",
        3: "Express your creativity",
        4: "Build something lasting",
        5: "Embrace change freely",
        6: "Nurture what matters",
        7: "Seek deeper truth",
        8: "Step into your power",
        9: "Serve the greater good",
        11: "Channel your vision",
        22: "Manifest your dreams",
        33: "Teach through love"
    };
    
    const moonMessages = {
        'New Moon': "Plant seeds of intention",
        'Waxing Crescent': "Nurture your new beginnings",
        'First Quarter': "Push through resistance",
        'Waxing Gibbous': "Refine and trust the process",
        'Full Moon': "Receive what's being revealed",
        'Waning Gibbous': "Share your wisdom",
        'Last Quarter': "Release what no longer serves",
        'Waning Crescent': "Rest and dream"
    };
    
    return `✧ ${user.name}, ${moonPhase.name} in the sky ✧

${moonMessages[moonPhase.name]}. As a Life Path ${user.life_path}, ${lifePathMessages[user.life_path].toLowerCase()}.

The cosmos moves with you.
— Cosmic Self`;
}

function generateLifeEssay(user) {
    // This would be much more elaborate in production
    // Could integrate with Claude API for truly personalized content
    return `
# The Cosmic Blueprint of ${user.name}

## Your Life Path: ${user.life_path}

You arrived on this Earth on ${user.birth_date}, under the sign of ${user.sun_sign}, in the Chinese year of the ${user.chinese_zodiac}. These are not coincidences—they are coordinates in the cosmic map of your existence.

As a Life Path ${user.life_path}, you carry a specific mission in this lifetime...

[Full personalized essay would continue here with deep analysis of their chart, life path meaning, Chinese zodiac traits, current transits affecting them, and guidance for their journey]

---
Generated with intention by Cosmic Self
An All Walks of Life Production
    `.trim();
}

function getCurrentCosmicWeather() {
    const moonPhase = getMoonPhase();
    
    return {
        moonPhase,
        sunSign: 'Capricorn', // Would calculate dynamically
        transits: [
            { planet: 'Mercury', sign: 'Capricorn', meaning: 'Practical thinking' },
            { planet: 'Venus', sign: 'Pisces', meaning: 'Compassionate love' },
            { planet: 'Mars', sign: 'Cancer', meaning: 'Protective action' }
        ],
        guidance: `The ${moonPhase.name} calls for ${moonPhase.energy}. Honor this rhythm.`
    };
}

// ============== SCHEDULED SMS ==============

// Send SMS 3x per week (Mon, Wed, Fri at 8am)
if (twilioClient) {
    cron.schedule('0 8 * * 1,3,5', async () => {
        console.log('Running scheduled SMS send...');
        
        try {
            const subscribers = await pool.query(
                "SELECT * FROM users WHERE subscription_tier = 'sms' AND phone IS NOT NULL"
            );
            
            for (const user of subscribers.rows) {
                const message = generatePersonalizedMessage(user);
                
                try {
                    await twilioClient.messages.create({
                        body: message,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: user.phone
                    });
                    
                    // Log the send
                    await pool.query(
                        'INSERT INTO sms_log (user_id, message, sent_at) VALUES ($1, $2, NOW())',
                        [user.id, message]
                    );
                } catch (smsError) {
                    console.error(`Failed to send SMS to user ${user.id}:`, smsError);
                }
            }
        } catch (error) {
            console.error('Scheduled SMS error:', error);
        }
    });
}

// ============== SERVE FRONTEND ==============

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============== START SERVER ==============

app.listen(PORT, () => {
    console.log(`✧ Cosmic Self running on port ${PORT} ✧`);
});
