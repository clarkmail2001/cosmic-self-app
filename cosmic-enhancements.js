// ============================================
// COSMIC SELF - ENHANCEMENTS MODULE
// Version 1.0
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
      const logo = document.querySelector('.logo') || document.querySelector('h1');
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
                              body: JSON.stringify({ priceId: product.priceId, productType: product.type, productName: product.name, userData: userData })
                });
                const session = await response.json();
                if (session.error) throw new Error(session.error);
                if (stripeInstance) await stripeInstance.redirectToCheckout({ sessionId: session.id });
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

function getUserData() {
      return {
                name: document.getElementById('userName')?.value || localStorage.getItem('cosmicUserName') || '',
                birthDate: document.getElementById('birthDate')?.value || localStorage.getItem('cosmicBirthDate') || '',
                birthTime: document.getElementById('birthTime')?.value || localStorage.getItem('cosmicBirthTime') || '',
                birthLocation: document.getElementById('birthLocation')?.value || localStorage.getItem('cosmicBirthLocation') || ''
      };
}

function showLoadingState(message) {
      const existing = document.getElementById('cosmicLoading');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'cosmicLoading';
      overlay.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><p>' + (message || 'Loading...') + '</p></div>';
      document.body.appendChild(overlay);
}

function hideLoadingState() {
      const overlay = document.getElementById('cosmicLoading');
      if (overlay) overlay.remove();
}

// ============================================
// 3. ENHANCEMENTS INJECTION
// ============================================

function injectBirthTimeInfo() {
      const birthTimeInput = document.getElementById('birthTime');
      if (!birthTimeInput) return;
      const container = birthTimeInput.closest('.form-group') || birthTimeInput.parentElement;
      if (!container || document.getElementById('birthTimeInfo')) return;
      const infoDiv = document.createElement('div');
      infoDiv.id = 'birthTimeInfo';
      infoDiv.className = 'birth-time-info';
      infoDiv.innerHTML = '<div class="info-toggle" onclick="toggleBirthTimeInfo()"><span>i</span> What if I dont know my birth time?</div><div class="birth-time-details" id="birthTimeDetails" style="display:none;"><p><strong>Accurate Without Time:</strong> Sun Sign, Chinese Zodiac, Life Path Number, Numerology</p><p><strong>Requires Time:</strong> Rising Sign, House Placements, Precise Moon</p><p><em>Without time you get ~70% of your cosmic blueprint.</em></p></div>';
      container.appendChild(infoDiv);
}

function toggleBirthTimeInfo() {
      const details = document.getElementById('birthTimeDetails');
      if (details) details.style.display = details.style.display === 'none' ? 'block' : 'none';
}
window.toggleBirthTimeInfo = toggleBirthTimeInfo;

function injectTransitExplanations() {
      const transitSection = document.getElementById('transitList') || document.querySelector('.transit-list');
      if (!transitSection || document.getElementById('transitExplanation')) return;
      const explanationDiv = document.createElement('div');
      explanationDiv.id = 'transitExplanation';
      explanationDiv.className = 'transit-explanation';
      explanationDiv.innerHTML = '<h4>What Does This Mean?</h4><div class="transit-summary-box"><h5>Todays Theme:</h5><p>The current planetary positions encourage grounding your dreams in practical action.</p></div><div class="personalized-prompt"><p>Want personalized transit alerts?</p><button class="cta-small" onclick="document.getElementById(\'pricing\')?.scrollIntoView({behavior:\'smooth\'})">Get Personalized Alerts</button></div>';
      transitSection.parentElement.appendChild(explanationDiv);
}

function enhancePricingSection() {
      const pricingSection = document.querySelector('.pricing-section') || document.getElementById('pricing');
      if (!pricingSection || document.querySelector('.free-features-note')) return;
      const note = document.createElement('div');
      note.className = 'free-features-note';
      note.innerHTML = '<h4>Already included for free:</h4><p>Life Path Number - Sun Sign - Chinese Zodiac - Moon Phase Guidance - Current Transits - Birth Chart Overview</p><p class="free-note-subtext">The data is free. Understanding what it means is where we help.</p>';
      pricingSection.appendChild(note);
}

// ============================================
// 4. INITIALIZATION
// ============================================

function initCosmicEnhancements() {
      console.log('Initializing Cosmic Enhancements...');
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
      setTimeout(() => {
                injectBirthTimeInfo();
                injectTransitExplanations();
                enhancePricingSection();
      }, 500);
      console.log('Cosmic Enhancements loaded!');
}

initCosmicEnhancements();
