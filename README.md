# Cosmic Self

**Know Your Place in the Universe**

An astrology and numerology platform offering free readings, personalized life essays ($5), and SMS cosmic guidance ($10/month).

---

## 🚀 Deploy to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** or **"Empty Project"**

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add PostgreSQL"**
3. Railway will automatically create `DATABASE_URL` variable

### Step 3: Deploy the App

**Option A: From GitHub**
1. Push this code to a GitHub repo
2. In Railway, click **"+ New" → "GitHub Repo"**
3. Select your repo

**Option B: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

### Step 4: Set Environment Variables

In Railway dashboard, go to **Variables** and add:

```
JWT_SECRET=generate-a-random-string-here
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
BASE_URL=https://your-app.railway.app
```

### Step 5: Initialize Database

After deployment, run:
```bash
railway run npm run db:init
```

### Step 6: Set Up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-app.railway.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 💳 Stripe Setup

### Products Created Automatically:
- **Life Essay**: $5 one-time
- **Cosmic SMS**: $10/month subscription

### Test Mode:
Use Stripe test keys (sk_test_...) for development.

Test card: `4242 4242 4242 4242`

---

## 📱 Twilio Setup (for SMS)

1. Create account at [twilio.com](https://twilio.com)
2. Get a phone number
3. Copy credentials to environment variables

SMS sends automatically:
- Monday, Wednesday, Friday at 8am
- Personalized to each subscriber's chart

---

## 🏗 Project Structure

```
cosmic-self-app/
├── server.js              # Express backend
├── package.json           # Dependencies
├── railway.toml           # Railway config
├── .env.example           # Environment template
├── scripts/
│   └── init-db.js        # Database setup
└── public/
    └── index.html        # Frontend (single-page app)
```

---

## 💰 Revenue Streams

| Product | Price | Type |
|---------|-------|------|
| Free Reading | $0 | Lead generation |
| Life Essay | $5 | One-time |
| Cosmic SMS | $10/mo | Subscription |
| Donations | Variable | One-time |

---

## 🌙 Features

### Free Tier
- Life Path Number calculation
- Sun sign & Chinese zodiac
- Current moon phase
- House & transit explanations

### Life Essay ($5)
- Deep personalized written analysis
- Your complete cosmic blueprint
- Downloadable PDF

### Cosmic SMS ($10/month)
- 3 texts per week
- Timed to moon movements
- Personalized to YOUR chart
- Cancel anytime

---

## An All Walks of Life Production

Built with intention. ✧
