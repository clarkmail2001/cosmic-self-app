// ============================================
// COSMIC SELF - ENHANCEMENTS MODULE
// Version 2.0 - With Fixed Pricing Section
// ============================================

// ============================================
// 1. ADMIN BYPASS SYSTEM
// ============================================

const ADMIN_CODE = 'cosmicadmin2024';

function isAdminMode() {
    return localStorage.getItem('cosmicAdminMode') === 'true';
}

function adminLogin(code) {
    if (code === ADMIN_CODE) {
        localStorage.setItem('cosmicAdminMode', 'true');
        console.log('Admin mode activated! Refresh to see all features.');
        location.reload();
        return true;
    }
    console.log('Invalid code.');
    return false;
}

function adminLogout() {
    localStorage.removeItem('cosmicAdminMode');
    console.log('Admin mode deactivated.');
    location.reload();
}

function checkAdminStatus() {
    if (isAdminMode()) {
        const adminBadge = document.createElement('div');
        adminBadge.id = 'adminBadge';
        adminBadge.innerHTML = 'ADMIN MODE';
        adminBadge.onclick = () => {
            if (confirm('Logout from admin mode?')) adminLogout();
        };
        document.body.appendChild(adminBadge);
        unlockAllFeatures();
    }
}

function unlockAllFeatures() {
    window.premiumUnlocked = true;
    document.querySelectorAll('.premium-locked').forEach(el => {
        el.classList.remove('premium-locked');
        el.classList.add('premium-unlocked');
    });
    document.querySelectorAll('.pricing-btn').forEach(btn => {
        if (!btn.classList.contains('admin-modified')) {
            btn.classList.add('admin-modified');
            btn.innerHTML = 'UNLOCKED (Admin)';
            btn.style.background = 'linear-gradient(135deg, #2d5a2d, #4a8f4a)';
            btn.onclick = (e) => {
                e.preventDefault();
                alert('You have admin access - this feature is unlocked!');
            };
        }
    });
}

// Hidden admin trigger: Click logo 5 times
let logoClickCount = 0;
let logoClickTimer = null;

function setupAdminTrigger() {
    const logo = document.querySelector('.logo') || document.querySelector('h1') || document.querySelector('.site-title');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => logoClickCount = 0, 2000);
            if (logoClickCount >= 5) {
                const code = prompt('Enter admin code:');
                if (code) adminLogin(code);
                logoClickCount = 0;
            }
        });
    }
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;

// ============================================
// 2. STRIPE INTEGRATION
// ============================================

const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';
let stripeInstance = null;

const PRODUCTS = {
    yearEssay: { priceId: 'price_year_essay', price: 500, name: 'Year Essay', type: 'one_time' },
    readingList: { priceId: 'price_reading_list', price: 500, name: 'Reading List', type: 'one_time' },
    lifeEssay: { priceId: 'price_life_essay', price: 1500, name: 'Life Essay', type: 'one_time' },
    cosmicSMS: { priceId: 'price_cosmic_sms', price: 1000, name: 'Cosmic SMS', type: 'subscription' }
};

function initStripe() {
    if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY !== 'pk_test_YOUR_KEY_HERE') {
        stripeInstance = Stripe(STRIPE_PUBLIC_KEY);
    }
}

async function purchaseProduct(productKey) {
    if (isAdminMode()) {
        alert('Admin mode: Product unlocked for free!');
        return;
    }
    const product = PRODUCTS[productKey];
    if (!product) return;
    try {
        showLoadingState('Preparing checkout...');
        const userData = getUserData();
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: productKey,
                productType: product.type,
                productName: product.name,
                userData: userData
            })
        });
        const session = await response.json();
        if (session.error) throw new Error(session.error);
        if (stripeInstance) {
            await stripeInstance.redirectToCheckout({ sessionId: session.id });
        } else {
            hideLoadingState();
            alert('Payment system is being configured. Please try again soon!');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        hideLoadingState();
        alert('Checkout is being set up. Please try again soon!');
    }
}

function purchaseYearEssay() { purchaseProduct('yearEssay'); }
function purchaseReadingList() { purchaseProduct('readingList'); }
function purchaseLifeEssay() { purchaseProduct('lifeEssay'); }
function subscribeToSMS() { purchaseProduct('cosmicSMS'); }

window.purchaseYearEssay = purchaseYearEssay;
window.purchaseReadingList = purchaseReadingList;
window.purchaseLifeEssay = purchaseLifeEssay;
window.subscribeToSMS = subscribeToSMS;

function getUserData() {
    return {
        name: document.getElementById('userName')?.value || localStorage.getItem('cosmicUserName') || '',
        birthDate: document.getElementById('birthDate')?.value || localStorage.getItem('cosmicBirthDate') || '',
        birthTime: document.getElementById('birthTime')?.value || localStorage.getItem('cosmicBirthTime') || '',
        birthLocation: document.getElementById('birthLocation')?.value || localStorage.getItem('cosmicBirthLocation') || ''
    };
}

function showLoadingState(message) {
    message = message || 'Loading...';
    const existing = document.getElementById('cosmicLoading');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'cosmicLoading';
    overlay.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><p>' + message + '</p></div>';
    document.body.appendChild(overlay);
}

function hideLoadingState() {
    const overlay = document.getElementById('cosmicLoading');
    if (overlay) overlay.remove();
}

// ============================================
// 3. BIRTH TIME TRANSPARENCY
// ============================================

function injectBirthTimeInfo() {
    const birthTimeInput = document.getElementById('birthTime') || document.querySelector('input[name="birthTime"]');
    if (!birthTimeInput) return;
    const container = birthTimeInput.closest('.form-group') || birthTimeInput.parentElement;
    if (!container || document.getElementById('birthTimeInfo')) return;
    const infoDiv = document.createElement('div');
    infoDiv.id = 'birthTimeInfo';
    infoDiv.className = 'birth-time-info';
    infoDiv.innerHTML = '<div class="info-toggle" onclick="toggleBirthTimeInfo()"><span class="info-icon">i</span> What if I do not know my birth time?</div><div class="birth-time-details" id="birthTimeDetails" style="display: none;"><div class="accuracy-grid"><div class="accuracy-column"><h4 class="accuracy-title accurate">Accurate Without Time</h4><ul><li>Sun Sign (your core identity)</li><li>Chinese Zodiac Animal and Element</li><li>Life Path Number</li><li>Expression and Soul Numbers</li><li>Current Year Guidance</li></ul></div><div class="accuracy-column"><h4 class="accuracy-title needs-time">Requires Birth Time</h4><ul><li>Rising Sign (Ascendant)</li><li>House Placements</li><li>Precise Moon Position</li></ul></div></div><p class="accuracy-note"><strong>Bottom line:</strong> Without time, you get about 70% of your cosmic blueprint.</p></div>';
    container.appendChild(infoDiv);
}

function toggleBirthTimeInfo() {
    const details = document.getElementById('birthTimeDetails');
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}
window.toggleBirthTimeInfo = toggleBirthTimeInfo;

// ============================================
// 4. TRANSIT EXPLANATIONS
// ============================================

function injectTransitExplanations() {
    const transitSection = document.getElementById('transitList') || document.querySelector('.transit-list');
    if (!transitSection || document.getElementById('transitExplanation')) return;
    const explanationDiv = document.createElement('div');
    explanationDiv.id = 'transitExplanation';
    explanationDiv.className = 'transit-explanation';
    explanationDiv.innerHTML = '<h4 class="explanation-title">What Does This Mean?</h4><div class="transit-synthesis"><p class="synthesis-intro">Here is how todays cosmic weather affects the collective energy:</p><div class="transit-summary-box"><h5>Todays Theme:</h5><p id="dailyTheme">The current planetary positions encourage grounding your dreams in practical action.</p></div></div><div class="personalized-prompt"><p>Want to know how these transits affect YOUR specific chart?</p><button class="cta-small" onclick="document.getElementById('pricingSection')?.scrollIntoView({behavior:'smooth'})">Get Personalized Transit Alerts</button></div>';
    transitSection.parentElement.appendChild(explanationDiv);
}

// ============================================
// 5. PLANETARY SYNTHESIS
// ============================================

function injectPlanetarySynthesis() {
    const chartSection = document.querySelector('.birth-chart-section') || document.getElementById('birthChart');
    if (!chartSection || document.getElementById('planetarySynthesis')) return;
    const synthesisDiv = document.createElement('div');
    synthesisDiv.id = 'planetarySynthesis';
    synthesisDiv.className = 'planetary-synthesis';
    synthesisDiv.innerHTML = '<div class="synthesis-header"><h3>Putting It All Together</h3><p class="synthesis-subtitle">How your planetary positions work as a whole</p></div><div class="synthesis-content"><p class="synthesis-lead">Your chart is not just separate placements - it is a symphony.</p><div class="synthesis-section"><h4>Your Core Identity Triangle</h4><div class="identity-triangle"><div class="triangle-point"><span class="point-label">SUN</span><span class="point-sign" id="synthSun">-</span><span class="point-meaning">Who you ARE</span></div><div class="triangle-point"><span class="point-label">MOON</span><span class="point-sign" id="synthMoon">-</span><span class="point-meaning">How you FEEL</span></div><div class="triangle-point"><span class="point-label">RISING</span><span class="point-sign" id="synthRising">-</span><span class="point-meaning">How you APPEAR</span></div></div></div><div class="synthesis-cta"><p>This is just the surface. Your Life Essay goes deeper with 15 paragraphs of personalized analysis.</p><button class="cta-button" onclick="purchaseLifeEssay()">Get Your Complete Life Essay - $15</button></div></div>';
    chartSection.parentElement.insertBefore(synthesisDiv, chartSection.nextSibling);
}

// ============================================
// 6. COMPLETELY REPLACE PRICING SECTION
// ============================================

function replacePricingSection() {
    const pricingSection = document.querySelector('.pricing-section') || document.getElementById('pricingSection');
    if (!pricingSection) {
        console.log('Pricing section not found');
        return;
    }
    if (document.getElementById('newPricingGrid')) return;
    console.log('Replacing pricing section with correct products...');
    const oldGrid = pricingSection.querySelector('div[style*="grid"]');
    if (oldGrid) oldGrid.remove();
    const newGrid = document.createElement('div');
    newGrid.id = 'newPricingGrid';
    newGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;';
    newGrid.innerHTML = '<div class="info-card" style="text-align: center; border: 1px solid rgba(201, 169, 98, 0.2); padding: 2rem; border-radius: 16px; background: var(--bg-card);"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div><h4 style="font-family: Cormorant Garamond, serif; font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-primary);">Year Essay</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$5</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">5 personalized paragraphs about YOUR current year. What themes, challenges, and opportunities are unfolding for you right now.</p><button class="pricing-btn" style="background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); border: none; padding: 12px 32px; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;" onclick="purchaseYearEssay()">Get Your Year Essay</button></div><div class="info-card" style="text-align: center; border: 1px solid rgba(201, 169, 98, 0.2); padding: 2rem; border-radius: 16px; background: var(--bg-card);"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div><h4 style="font-family: Cormorant Garamond, serif; font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-primary);">Reading List</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$5</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">Personalized book and resource recommendations based on your chart to help you understand your unique path.</p><button class="pricing-btn" style="background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); border: none; padding: 12px 32px; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;" onclick="purchaseReadingList()">Get Your Reading List</button></div><div class="info-card" style="text-align: center; border: 1px solid rgba(201, 169, 98, 0.2); padding: 2rem; border-radius: 16px; background: var(--bg-card);"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⭐</div><h4 style="font-family: Cormorant Garamond, serif; font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-primary);">Life Essay</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$15</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">15 in-depth paragraphs analyzing your complete cosmic blueprint - life themes, soul purpose, relationships, and career.</p><button class="pricing-btn" style="background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); border: none; padding: 12px 32px; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;" onclick="purchaseLifeEssay()">Get Your Life Essay</button></div><div class="info-card" style="text-align: center; border: 2px solid var(--gold); padding: 2rem; border-radius: 16px; background: var(--bg-card); position: relative;"><div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); padding: 4px 16px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">MOST POPULAR</div><div style="font-size: 2.5rem; margin-bottom: 0.5rem; margin-top: 0.5rem;">📱</div><h4 style="font-family: Cormorant Garamond, serif; font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--text-primary);">Cosmic SMS</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$10<span style="font-size: 1rem;">/mo</span></div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Cancel anytime</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">Stay cosmically aligned with 3 personalized texts per week plus a monthly deep-dive paragraph.</p><button class="pricing-btn" style="background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); border: none; padding: 12px 32px; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;" onclick="subscribeToSMS()">Subscribe Now</button></div>';
    const subtitle = pricingSection.querySelector('.section-subtitle') || pricingSection.querySelector('p');
    if (subtitle) subtitle.after(newGrid);
    else pricingSection.appendChild(newGrid);
    if (!document.querySelector('.free-features-note')) {
        const note = document.createElement('div');
        note.className = 'free-features-note';
        note.style.cssText = 'margin-top: 3rem; padding: 1.5rem; text-align: center; background: rgba(201, 169, 98, 0.05); border-radius: 16px; border: 1px dashed rgba(201, 169, 98, 0.3);';
        note.innerHTML = '<h4 style="color: var(--gold); font-size: 1rem; margin-bottom: 0.75rem;">Already included for free:</h4><p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8;">Life Path Number - Sun Sign and Chinese Zodiac - Moon Phase Guidance - Current Transits - Birth Chart Overview - House Placements - Moon Calendar</p><p style="margin-top: 0.75rem; font-style: italic; color: #6b6b77; font-size: 0.85rem;">The data is free. Understanding what it means for YOU is where we help.</p>';
        pricingSection.appendChild(note);
    }
    console.log('Pricing section replaced with 4 separate products!');
}

// ============================================
// 7. CHINESE ZODIAC ENHANCEMENT
// ============================================

function enhanceChineseZodiac() {
    const zodiacSection = document.querySelector('.zodiac-card') || document.getElementById('chineseZodiac');
    if (!zodiacSection) return;
    if (!document.getElementById('zodiacLearnMore')) {
        const learnMore = document.createElement('div');
        learnMore.id = 'zodiacLearnMore';
        learnMore.className = 'zodiac-learn-more';
        learnMore.innerHTML = '<p class="zodiac-teaser">Your element-animal combination has unique strengths and challenges...</p><button class="cta-small" onclick="purchaseLifeEssay()">Get Full Analysis in Your Life Essay</button>';
        zodiacSection.appendChild(learnMore);
    }
}

// ============================================
// 8. FIX 12 HOUSES GAP
// ============================================

function fix12HousesGap() {
    const housesSection = document.querySelector('#houses') || document.querySelector('.houses-section');
    if (!housesSection) return;
    const subtitle = housesSection.querySelector('.section-subtitle');
    const houseCards = housesSection.querySelector('.houses-grid') || housesSection.querySelector('div[style*="grid"]');
    if (subtitle && houseCards) {
        subtitle.style.marginBottom = '1.5rem';
        houseCards.style.marginTop = '0';
    }
    console.log('12 Houses gap fixed!');
}

// ============================================
// 9. INITIALIZATION
// ============================================

function initCosmicEnhancements() {
    console.log('Initializing Cosmic Enhancements v2.0...');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runEnhancements);
    } else {
        runEnhancements();
    }
}

function runEnhancements() {
    checkAdminStatus();
    setupAdminTrigger();
    initStripe();
    setTimeout(function() {
        replacePricingSection();
        fix12HousesGap();
    }, 300);
    setTimeout(function() {
        injectBirthTimeInfo();
        injectTransitExplanations();
    }, 500);
    setTimeout(function() {
        injectPlanetarySynthesis();
        enhanceChineseZodiac();
    }, 1500);
    console.log('Cosmic Enhancements v2.0 loaded!');
}

initCosmicEnhancements();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        adminLogin: adminLogin,
        adminLogout: adminLogout,
        isAdminMode: isAdminMode,
        purchaseYearEssay: purchaseYearEssay,
        purchaseReadingList: purchaseReadingList,
        purchaseLifeEssay: purchaseLifeEssay,
        subscribeToSMS: subscribeToSMS,
        PRODUCTS: PRODUCTS
    };
}
