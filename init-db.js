require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
    console.log('Initializing database...');
    
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                birth_date DATE,
                birth_time TIME,
                birth_place VARCHAR(255),
                phone VARCHAR(20),
                life_path INTEGER,
                sun_sign VARCHAR(50),
                chinese_zodiac VARCHAR(50),
                subscription_tier VARCHAR(20) DEFAULT 'free',
                stripe_customer_id VARCHAR(255),
                has_life_essay BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Users table ready');
        
        // SMS log table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sms_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ SMS log table ready');
        
        // Donations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS donations (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255),
                amount INTEGER,
                stripe_session_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Donations table ready');
        
        // Essays table (to cache generated essays)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS life_essays (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                content TEXT,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Life essays table ready');
        
        console.log('\n✧ Database initialization complete ✧');
        
    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        await pool.end();
    }
}

initDatabase();
