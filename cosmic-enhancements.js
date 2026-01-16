// ============================================
// COSMIC SELF - ENHANCEMENTS MODULE
// Version 2.0 - With Fixed Pricing Section
// ============================================

// ============================================
// 0. SEO META TAGS INJECTION
// ============================================

(function injectSEO() {
            var seoTags = [
                    { name: 'description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings. Get your free birth chart analysis, life path number, moon phase guidance, and planetary transits.' },
                    { name: 'keywords', content: 'astrology, numerology, birth chart, horoscope, zodiac, life path number, moon phases, Chinese zodiac, cosmic guidance, planetary transits' },
                    { name: 'author', content: 'Cosmic Self' },
                    { name: 'robots', content: 'index, follow' },
                    { property: 'og:type', content: 'website' },
                    { property: 'og:url', content: 'https://cosmic-self-app-production.up.railway.app/' },
                    { property: 'og:title', content: 'Cosmic Self | Know Your Place in the Universe' },
                    { property: 'og:description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings.' },
                    { name: 'twitter:card', content: 'summary_large_image' },
                    { name: 'twitter:title', content: 'Cosmic Self | Know Your Place in the Universe' },
                    { name: 'twitter:description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings.' }
                        ];
            seoTags.forEach(function(tag) {
                            var meta = document.createElement('meta');
                            if (tag.name) meta.setAttribute('name', tag.name);
                            if (tag.property) meta.setAttribute('property', tag.property);
                            meta.setAttribute('content', tag.content);
                            document.head.appendChild(meta);
            });
            var canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            canonical.setAttribute('href', 'https://cosmic-self-app-production.up.railway.app/');
            document.head.appendChild(canonical);
            console.log('SEO meta tags injected');
})();


// ============================================
// 1. ADMIN BYPASS SYSTEM
// ============================================

var ADMIN_CODE = 'cosmicadmin2024';

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
                    var adminBadge = document.createElement('div');
                    adminBadge.id = 'adminBadge';
                    adminBadge.innerHTML = 'ADMIN MODE';
                    adminBadge.onclick = function() {
                                    if (confirm('Logout from admin mode?')) adminLogout();
                    };
                    document.body.appendChild(adminBadge);
                    unlockAllFeatures();
        }
}

function unlockAllFeatures() {
        window.premiumUnlocked = true;
        document.querySelectorAll('.premium-locked').forEach(function(el) {
                    el.classList.remove('premium-locked');
                    el.classList.add('premium-unlocked');
        });
        document.querySelectorAll('.pricing-btn').forEach(function(btn) {
                    if (!btn.classList.contains('admin-modified')) {
                                    btn.classList.add('admin-modified');
                                    btn.innerHTML = 'UNLOCKED (Admin)';
                                    btn.style.background = 'linear-gradient(135deg, #2d5a2d, #4a8f4a)';
                                    btn.onclick = function(e) {
                                                        e.preventDefault();
                                                        alert('You have admin access - this feature is unlocked!');
                                    };
                    }
        });
}

var logoClickCount = 0;
var logoClickTimer = null;

function setupAdminTrigger() {
        var logo = document.querySelector('.logo') || document.querySelector('h1') || document.querySelector('.site-title');
        if (logo) {
                    logo.style.cursor = 'pointer';
                    logo.addEventListener('click', function() {
                                    logoClickCount++;
                                    clearTimeout(logoClickTimer);
                                    logoClickTimer = setTimeout(function() { logoClickCount = 0; }, 2000);
                                    if (logoClickCount >= 5) {
                                                        var code = prompt('Enter admin code:');
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

var STRIPE_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';
var stripeInstance = null;

var PRODUCTS = {
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

function purchaseProduct(productKey) {
        if (isAdminMode()) {
                    alert('Admin mode: Product unlocked for free!');
                    return;
        }

    var product = PRODUCTS[productKey];
        if (!product) return;

    showLoadingState('Preparing checkout...');
        var userData = getUserData();

    fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                                priceId: productKey,
                                productType: product.type,
                                productName: product.name,
                                userData: userData
                })
    })
        .then(function(response) { return response.json(); })
        .then(function(session) {
                    if (session.error) throw new Error(session.error);
                    if (stripeInstance) {
                                    stripeInstance.redirectToCheckout({ sessionId: session.id });
                    } else {
                                    hideLoadingState();
                                    alert('Payment system is being configured. Please try again soon!');
                    }
        })
        .catch(function(error) {
                    console.error('Checkout error:', error);
                    hideLoadingState();
                    alert('Checkout is being set up. Please try again soon!');
        });
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
        var nameEl = document.getElementById('userName');
        var dateEl = document.getElementById('birthDate');
        var timeEl = document.getElementById('birthTime');
        var locEl = document.getElementById('birthLocation');
        return {
                    name: (nameEl ? nameEl.value : '') || localStorage.getItem('cosmicUserName') || '',
                    birthDate: (dateEl ? dateEl.value : '') || localStorage.getItem('cosmicBirthDate') || '',
                    birthTime: (timeEl ? timeEl.value : '') || localStorage.getItem('cosmicBirthTime') || '',
                    birthLocation: (locEl ? locEl.value : '') || localStorage.getItem('cosmicBirthLocation') || ''
        };
}

function showLoadingState(message) {
        message = message || 'Loading...';
        var existing = document.getElementById('cosmicLoading');
        if (existing) existing.remove();

    var overlay = document.createElement('div');
        overlay.id = 'cosmicLoading';
        overlay.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><p>' + message + '</p></div>';
        document.body.appendChild(overlay);
}

function hideLoadingState() {
        var overlay = document.getElementById('cosmicLoading');
        if (overlay) overlay.remove();
}

// ============================================
// 3. BIRTH TIME TRANSPARENCY
// ============================================

function injectBirthTimeInfo() {
        var birthTimeInput = document.getElementById('birthTime') || document.querySelector('input[name="birthTime"]');
        if (!birthTimeInput) return;

    var container = birthTimeInput.closest('.form-group') || birthTimeInput.parentElement;
        if (!container || document.getElementById('birthTimeInfo')) return;

    var infoDiv = document.createElement('div');
        infoDiv.id = 'birthTimeInfo';
        infoDiv.className = 'birth-time-info';
        infoDiv.innerHTML = '<div class="info-toggle" onclick="toggleBirthTimeInfo()"><span class="info-icon">i</span> What if I do not know my birth time?</div><div class="birth-time-details" id="birthTimeDetails" style="display: none;"><p class="accuracy-note"><strong>Bottom line:</strong> Without time, you get about 70% of your cosmic blueprint. Sun sign, Chinese zodiac, and numerology are 100% accurate.</p></div>';
        container.appendChild(infoDiv);
}

function toggleBirthTimeInfo() {
        var details = document.getElementById('birthTimeDetails');
        if (details) {
                    details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
}
window.toggleBirthTimeInfo = toggleBirthTimeInfo;

// ============================================
// 4. TRANSIT EXPLANATIONS
// ============================================

function injectTransitExplanations() {
        var transitSection = document.getElementById(// ============================================
            // COSMIC SELF - ENHANCEMENTS MODULE
            // Version 2.0 - With Fixed Pricing Section
            // ============================================

            // ============================================
            // 1. ADMIN BYPASS SYSTEM
            // ============================================

            var ADMIN_CODE = 'cosmicadmin2024';

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
                    var adminBadge = document.createElement('div');
                    adminBadge.id = 'adminBadge';
                    adminBadge.innerHTML = 'ADMIN MODE';
                    adminBadge.onclick = function() {
                                    if (confirm('Logout from admin mode?')) adminLogout();
                    };
                    document.body.appendChild(adminBadge);
                    unlockAllFeatures();
        }
}

function unlockAllFeatures() {
        window.premiumUnlocked = true;
        document.querySelectorAll('.premium-locked').forEach(function(el) {
                    el.classList.remove('premium-locked');
                    el.classList.add('premium-unlocked');
        });
        document.querySelectorAll('.pricing-btn').forEach(function(btn) {
                    if (!btn.classList.contains('admin-modified')) {
                                    btn.classList.add('admin-modified');
                                    btn.innerHTML = 'UNLOCKED (Admin)';
                                    btn.style.background = 'linear-gradient(135deg, #2d5a2d, #4a8f4a)';
                                    btn.onclick = function(e) {
                                                        e.preventDefault();
                                                        alert('You have admin access - this feature is unlocked!');
                                    };
                    }
        });
}

var logoClickCount = 0;
    var logoClickTimer = null;

function setupAdminTrigger() {
        var logo = document.querySelector('.logo') || document.querySelector('h1') || document.querySelector('.site-title');
        if (logo) {
                    logo.style.cursor = 'pointer';
                    logo.addEventListener('click', function() {
                                    logoClickCount++;
                                    clearTimeout(logoClickTimer);
                                    logoClickTimer = setTimeout(function() { logoClickCount = 0; }, 2000);
                                    if (logoClickCount >= 5) {
                                                        var code = prompt('Enter admin code:');
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

var STRIPE_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';
    var stripeInstance = null;

var PRODUCTS = {
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

function purchaseProduct(productKey) {
        if (isAdminMode()) {
                    alert('Admin mode: Product unlocked for free!');
                    return;
        }

        var product = PRODUCTS[productKey];
        if (!product) return;

        showLoadingState('Preparing checkout...');
        var userData = getUserData();

        fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                                    priceId: productKey,
                                    productType: product.type,
                                    productName: product.name,
                                    userData: userData
                    })
        })
        .then(function(response) { return response.json(); })
        .then(function(session) {
                    if (session.error) throw new Error(session.error);
                    if (stripeInstance) {
                                    stripeInstance.redirectToCheckout({ sessionId: session.id });
                    } else {
                                    hideLoadingState();
                                    alert('Payment system is being configured. Please try again soon!');
                    }
        })
        .catch(function(error) {
                    console.error('Checkout error:', error);
                    hideLoadingState();
                    alert('Checkout is being set up. Please try again soon!');
        });
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
        var nameEl = document.getElementById('userName');
        var dateEl = document.getElementById('birthDate');
        var timeEl = document.getElementById('birthTime');
        var locEl = document.getElementById('birthLocation');
        return {
                    name: (nameEl ? nameEl.value : '') || localStorage.getItem('cosmicUserName') || '',
                    birthDate: (dateEl ? dateEl.value : '') || localStorage.getItem('cosmicBirthDate') || '',
                    birthTime: (timeEl ? timeEl.value : '') || localStorage.getItem('cosmicBirthTime') || '',
                    birthLocation: (locEl ? locEl.value : '') || localStorage.getItem('cosmicBirthLocation') || ''
        };
}

function showLoadingState(message) {
        message = message || 'Loading...';
        var existing = document.getElementById('cosmicLoading');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'cosmicLoading';
        overlay.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><p>' + message + '</p></div>';
        document.body.appendChild(overlay);
}

function hideLoadingState() {
        var overlay = document.getElementById('cosmicLoading');
        if (overlay) overlay.remove();
}

// ============================================
// 3. BIRTH TIME TRANSPARENCY
// ============================================

function injectBirthTimeInfo() {
        var birthTimeInput = document.getElementById('birthTime') || document.querySelector('input[name="birthTime"]');
        if (!birthTimeInput) return;

        var container = birthTimeInput.closest('.form-group') || birthTimeInput.parentElement;
        if (!container || document.getElementById('birthTimeInfo')) return;

        var infoDiv = document.createElement('div');
        infoDiv.id = 'birthTimeInfo';
        infoDiv.className = 'birth-time-info';
        infoDiv.innerHTML = '<div class="info-toggle" onclick="toggleBirthTimeInfo()"><span class="info-icon">i</span> What if I do not know my birth time?</div><div class="birth-time-details" id="birthTimeDetails" style="display: none;"><p class="accuracy-note"><strong>Bottom line:</strong> Without time, you get about 70% of your cosmic blueprint. Sun sign, Chinese zodiac, and numerology are 100% accurate.</p></div>';
        container.appendChild(infoDiv);
}

function toggleBirthTimeInfo() {
        var details = document.getElementById('birthTimeDetails');
        if (details) {
                    details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
}
    window.toggleBirthTimeInfo = toggleBirthTimeInfo;

// ============================================
// 4. TRANSIT EXPLANATIONS
// ============================================

function injectTransitExplanations() {
        var transitSection = document.getElementById('transitList') || document.querySelector('.transit-list');
        if (!transitSection || document.getElementById('transitExplanation')) return;

        var explanationDiv = document.createElement('div');
        explanationDiv.id = 'transitExplanation';
        explanationDiv.className = 'transit-explanation';
        explanationDiv.innerHTML = '<h4 class="explanation-title">What Does This Mean?</h4><div class="transit-synthesis"><p class="synthesis-intro">Here is how today cosmic weather affects the collective energy.</p></div>';
        transitSection.parentElement.appendChild(explanationDiv);
}

// ============================================
// 5. PLANETARY SYNTHESIS
// ============================================

function injectPlanetarySynthesis() {
        var chartSection = document.querySelector('.birth-chart-section') || document.getElementById('birthChart');
        if (!chartSection || document.getElementById('planetarySynthesis')) return;

        var synthesisDiv = document.createElement('div');
        synthesisDiv.id = 'planetarySynthesis';
        synthesisDiv.className = 'planetary-synthesis';
        synthesisDiv.innerHTML = '<div class="synthesis-header"><h3>Putting It All Together</h3></div>';
        chartSection.parentElement.insertBefore(synthesisDiv, chartSection.nextSibling);
}

// ============================================
// 6. REPLACE PRICING SECTION - THE KEY FIX
// ============================================

function replacePricingSection() {
        var pricingSection = document.querySelector('.pricing-section') || document.getElementById('pricingSection');
        if (!pricingSection) {
                    console.log('Pricing section not found');
                    return;
        }

        if (document.getElementById('newPricingGrid')) return;

        console.log('Replacing pricing section with correct products...');

        var oldGrid = pricingSection.querySelector('div[style*="grid"]');
        if (oldGrid) {
                    oldGrid.remove();
        }

        var newGrid = document.createElement('div');
        newGrid.id = 'newPricingGrid';
        newGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;';

        var cardStyle = 'text-align: center; border: 1px solid rgba(201, 169, 98, 0.2); padding: 2rem; border-radius: 16px; background: var(--bg-card);';
        var btnStyle = 'background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); border: none; padding: 12px 32px; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;';

        var card1 = document.createElement('div');
        card1.className = 'info-card';
        card1.style.cssText = cardStyle;
        card1.innerHTML = '<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div><h4 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Year Essay</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$5</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">5 personalized paragraphs about YOUR current year themes and opportunities.</p><button class="pricing-btn" style="' + btnStyle + '" onclick="purchaseYearEssay()">Get Your Year Essay</button>';

        var card2 = document.createElement('div');
        card2.className = 'info-card';
        card2.style.cssText = cardStyle;
        card2.innerHTML = '<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div><h4 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Reading List</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$5</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Personalized book recommendations based on your chart.</p><button class="pricing-btn" style="' + btnStyle + '" onclick="purchaseReadingList()">Get Your Reading List</button>';

        var card3 = document.createElement('div');
        card3.className = 'info-card';
        card3.style.cssText = cardStyle;
        card3.innerHTML = '<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⭐</div><h4 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Life Essay</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$15</div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">One-time purchase</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">15 in-depth paragraphs analyzing your complete cosmic blueprint.</p><button class="pricing-btn" style="' + btnStyle + '" onclick="purchaseLifeEssay()">Get Your Life Essay</button>';

        var card4 = document.createElement('div');
        card4.className = 'info-card';
        card4.style.cssText = cardStyle + ' border: 2px solid var(--gold); position: relative;';
        card4.innerHTML = '<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--gold), var(--gold-bright)); color: var(--bg-deep); padding: 4px 16px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">MOST POPULAR</div><div style="font-size: 2.5rem; margin-bottom: 0.5rem; margin-top: 0.5rem;">📱</div><h4 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Cosmic SMS</h4><div style="font-size: 2rem; color: var(--gold); margin-bottom: 0.25rem;">$10<span style="font-size: 1rem;">/mo</span></div><div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Cancel anytime</div><p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">3 personalized texts per week plus monthly deep dive.</p><button class="pricing-btn" style="' + btnStyle + '" onclick="subscribeToSMS()">Subscribe Now</button>';

        newGrid.appendChild(card1);
        newGrid.appendChild(card2);
        newGrid.appendChild(card3);
        newGrid.appendChild(card4);

        var subtitle = pricingSection.querySelector('.section-subtitle') || pricingSection.querySelector('p');
        if (subtitle) {
                    subtitle.after(newGrid);
        } else {
                    pricingSection.appendChild(newGrid);
        }

        if (!document.querySelector('.free-features-note')) {
                    var note = document.createElement('div');
                    note.className = 'free-features-note';
                    note.style.cssText = 'margin-top: 3rem; padding: 1.5rem; text-align: center; background: rgba(201, 169, 98, 0.05); border-radius: 16px; border: 1px dashed rgba(201, 169, 98, 0.3);';
                    note.innerHTML = '<h4 style="color: var(--gold); font-size: 1rem; margin-bottom: 0.75rem;">Already included for free:</h4><p style="color: var(--text-secondary); font-size: 0.9rem;">Life Path Number - Sun Sign - Chinese Zodiac - Moon Phase - Current Transits - Birth Chart - House Placements</p>';
                    pricingSection.appendChild(note);
        }

        console.log('Pricing section replaced with 4 separate products!');
}

// ============================================
// 7. CHINESE ZODIAC ENHANCEMENT
// ============================================

function enhanceChineseZodiac() {
        var zodiacSection = document.querySelector('.zodiac-card') || document.getElementById('chineseZodiac');
        if (!zodiacSection || document.getElementById('zodiacLearnMore')) return;

        var learnMore = document.createElement('div');
        learnMore.id = 'zodiacLearnMore';
        learnMore.className = 'zodiac-learn-more';
        learnMore.innerHTML = '<p class="zodiac-teaser">Your element-animal combination has unique strengths...</p><button class="cta-small" onclick="purchaseLifeEssay()">Get Full Analysis</button>';
        zodiacSection.appendChild(learnMore);
}

// ============================================
// 8. FIX 12 HOUSES GAP
// ============================================

function fix12HousesGap() {
        var housesSection = document.querySelector('#houses') || document.querySelector('.houses-section');
        if (!housesSection) return;

        var subtitle = housesSection.querySelector('.section-subtitle');
        var houseCards = housesSection.querySelector('.houses-grid') || housesSection.querySelector('div[style*="grid"]');

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
