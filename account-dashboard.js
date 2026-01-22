// account-dashboard.js
// Adds account dashboard, essay viewing, and purchase functionality to Cosmic Self
// Safe addition - doesn't modify existing code

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    initAccountSystem();
  });

  // Also try immediately in case DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAccountSystem, 100);
  }

  let currentUser = null;
  let authToken = localStorage.getItem('cosmicToken');

  function initAccountSystem() {
    // Check if already initialized
    if (document.getElementById('account-dashboard-container')) return;
    
    // Create and inject the dashboard HTML
    createDashboardUI();
    
    // Check if user is logged in
    if (authToken) {
      fetchUserData();
    }
    
    // Add event listeners
    setupEventListeners();
  }

  function createDashboardUI() {
    // Create the main dashboard container
    const dashboardHTML = `
      <!-- Account Dashboard Modal -->
      <div id="account-modal" class="cosmic-modal" style="display: none;">
        <div class="cosmic-modal-content">
          <span class="cosmic-modal-close">&times;</span>
          <div id="account-modal-body">
            <!-- Content will be injected here -->
          </div>
        </div>
      </div>

      <!-- Essay Viewer Modal -->
      <div id="essay-modal" class="cosmic-modal" style="display: none;">
        <div class="cosmic-modal-content cosmic-modal-large">
          <span class="cosmic-modal-close">&times;</span>
          <div id="essay-modal-body">
            <!-- Essay content will be injected here -->
          </div>
        </div>
      </div>

      <!-- Account Button (fixed position) -->
      <div id="account-button-container" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
        <button id="account-btn" class="cosmic-btn-account">
          ✧ Account
        </button>
      </div>
    `;

    // Create container and add to page
    const container = document.createElement('div');
    container.id = 'account-dashboard-container';
    container.innerHTML = dashboardHTML;
    document.body.appendChild(container);

    // Add styles
    addDashboardStyles();
  }

  function addDashboardStyles() {
    const styles = `
      <style id="account-dashboard-styles">
        /* Modal Styles */
        .cosmic-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .cosmic-modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #c9a227;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 30px;
          position: relative;
          color: #e8e8e8;
        }

        .cosmic-modal-large {
          max-width: 800px;
          max-height: 90vh;
        }

        .cosmic-modal-close {
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 28px;
          color: #c9a227;
          cursor: pointer;
          transition: color 0.3s;
        }

        .cosmic-modal-close:hover {
          color: #fff;
        }

        /* Account Button */
        .cosmic-btn-account {
          background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
          color: #1a1a2e;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3);
        }

        .cosmic-btn-account:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(201, 162, 39, 0.4);
        }

        /* Form Styles */
        .cosmic-form-group {
          margin-bottom: 20px;
        }

        .cosmic-form-group label {
          display: block;
          margin-bottom: 8px;
          color: #c9a227;
          font-size: 14px;
        }

        .cosmic-form-group input {
          width: 100%;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(201, 162, 39, 0.3);
          border-radius: 8px;
          color: #e8e8e8;
          font-size: 16px;
          box-sizing: border-box;
        }

        .cosmic-form-group input:focus {
          outline: none;
          border-color: #c9a227;
        }

        .cosmic-btn {
          background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
          color: #1a1a2e;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .cosmic-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(201, 162, 39, 0.4);
        }

        .cosmic-btn-secondary {
          background: transparent;
          border: 1px solid #c9a227;
          color: #c9a227;
        }

        .cosmic-btn-secondary:hover {
          background: rgba(201, 162, 39, 0.1);
        }

        /* Dashboard Styles */
        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          color: #c9a227;
          font-size: 24px;
          margin-bottom: 5px;
        }

        .dashboard-header p {
          color: #888;
          font-size: 14px;
        }

        .cosmic-info-box {
          background: rgba(201, 162, 39, 0.1);
          border: 1px solid rgba(201, 162, 39, 0.3);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .cosmic-info-box h3 {
          color: #c9a227;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .cosmic-info-box p {
          color: #ccc;
          margin: 5px 0;
          font-size: 14px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(201, 162, 39, 0.2);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 15px;
        }

        .product-card h4 {
          color: #c9a227;
          margin-bottom: 8px;
        }

        .product-card p {
          color: #999;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .product-card .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .product-card .status.owned {
          background: rgba(39, 201, 63, 0.2);
          color: #27c93f;
        }

        .product-card .status.locked {
          background: rgba(201, 162, 39, 0.2);
          color: #c9a227;
        }

        .cosmic-btn-small {
          padding: 10px 20px;
          font-size: 14px;
          width: auto;
        }

        /* Essay Display */
        .essay-content {
          white-space: pre-wrap;
          font-family: 'Georgia', serif;
          line-height: 1.8;
          color: #e8e8e8;
        }

        .essay-content h1, .essay-content h2, .essay-content h3 {
          color: #c9a227;
        }

        /* Auth Toggle */
        .auth-toggle {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(201, 162, 39, 0.2);
        }

        .auth-toggle a {
          color: #c9a227;
          cursor: pointer;
          text-decoration: underline;
        }

        .auth-toggle a:hover {
          color: #fff;
        }

        /* Error/Success Messages */
        .cosmic-message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .cosmic-message.error {
          background: rgba(255, 71, 87, 0.2);
          border: 1px solid rgba(255, 71, 87, 0.5);
          color: #ff4757;
        }

        .cosmic-message.success {
          background: rgba(39, 201, 63, 0.2);
          border: 1px solid rgba(39, 201, 63, 0.5);
          color: #27c93f;
        }

        /* Loading State */
        .cosmic-loading {
          text-align: center;
          padding: 40px;
          color: #c9a227;
        }

        .cosmic-loading::after {
          content: '';
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #c9a227;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
          margin-left: 10px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 600px) {
          .cosmic-modal-content {
            padding: 20px;
            margin: 10px;
          }
          
          #account-button-container {
            top: 10px;
            right: 10px;
          }
          
          .cosmic-btn-account {
            padding: 10px 16px;
            font-size: 12px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  function setupEventListeners() {
    // Account button click
    document.getElementById('account-btn').addEventListener('click', function() {
      if (currentUser) {
        showDashboard();
      } else {
        showLoginForm();
      }
    });

    // Modal close buttons
    document.querySelectorAll('.cosmic-modal-close').forEach(btn => {
      btn.addEventListener('click', function() {
        this.closest('.cosmic-modal').style.display = 'none';
      });
    });

    // Close modal on outside click
    document.querySelectorAll('.cosmic-modal').forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          this.style.display = 'none';
        }
      });
    });
  }

  function showLoginForm() {
    const modal = document.getElementById('account-modal');
    const body = document.getElementById('account-modal-body');

    body.innerHTML = `
      <div class="dashboard-header">
        <h2>✧ Welcome Back ✧</h2>
        <p>Sign in to access your cosmic content</p>
      </div>

      <div id="auth-message"></div>

      <form id="login-form">
        <div class="cosmic-form-group">
          <label>Email Address</label>
          <input type="email" id="login-email" required placeholder="your@email.com">
        </div>

        <div class="cosmic-form-group">
          <label>Password</label>
          <input type="password" id="login-password" required placeholder="Enter your password">
        </div>

        <button type="submit" class="cosmic-btn">Sign In</button>
      </form>

      <div class="auth-toggle">
        <p>Don't have an account? <a id="show-register">Create one</a></p>
      </div>
    `;

    modal.style.display = 'flex';

    // Login form submit
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Toggle to register
    document.getElementById('show-register').addEventListener('click', showRegisterForm);
  }

  function showRegisterForm() {
    const body = document.getElementById('account-modal-body');

    // Get birth data from main form if available
    const nameInput = document.querySelector('input[placeholder*="wish to be known"]') || 
                      document.querySelector('input[name="name"]');
    const dateInput = document.querySelector('input[type="date"]');
    
    const existingName = nameInput ? nameInput.value : '';
    const existingDate = dateInput ? dateInput.value : '';

    body.innerHTML = `
      <div class="dashboard-header">
        <h2>✧ Create Account ✧</h2>
        <p>Join to save your readings and access premium content</p>
      </div>

      <div id="auth-message"></div>

      <form id="register-form">
        <div class="cosmic-form-group">
          <label>Your Name</label>
          <input type="text" id="register-name" required placeholder="How you wish to be known" value="${existingName}">
        </div>

        <div class="cosmic-form-group">
          <label>Email Address</label>
          <input type="email" id="register-email" required placeholder="your@email.com">
        </div>

        <div class="cosmic-form-group">
          <label>Password</label>
          <input type="password" id="register-password" required placeholder="Create a password" minlength="6">
        </div>

        <div class="cosmic-form-group">
          <label>Birth Date</label>
          <input type="date" id="register-birthdate" required value="${existingDate}">
        </div>

        <div class="cosmic-form-group">
          <label>Birth Time (Optional)</label>
          <input type="time" id="register-birthtime">
        </div>

        <div class="cosmic-form-group">
          <label>Birth Location (Optional)</label>
          <input type="text" id="register-birthlocation" placeholder="City, State/Country">
        </div>

        <button type="submit" class="cosmic-btn">Create Account</button>
      </form>

      <div class="auth-toggle">
        <p>Already have an account? <a id="show-login">Sign in</a></p>
      </div>
    `;

    // Register form submit
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Toggle to login
    document.getElementById('show-login').addEventListener('click', showLoginForm);
  }

  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('auth-message');

    try {
      messageDiv.innerHTML = '<div class="cosmic-loading">Connecting to the cosmos</div>';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token and user
      authToken = data.token;
      localStorage.setItem('cosmicToken', authToken);
      currentUser = data.user;

      // Update button
      document.getElementById('account-btn').textContent = '✧ ' + (currentUser.name || 'Account');

      // Show dashboard
      showDashboard();

    } catch (error) {
      messageDiv.innerHTML = `<div class="cosmic-message error">${error.message}</div>`;
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const birthDate = document.getElementById('register-birthdate').value;
    const birthTime = document.getElementById('register-birthtime').value;
    const birthPlace = document.getElementById('register-birthlocation').value;
    const messageDiv = document.getElementById('auth-message');

    try {
      messageDiv.innerHTML = '<div class="cosmic-loading">Creating your cosmic profile</div>';

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          birthDate,
          birthTime: birthTime || null,
          birthPlace: birthPlace || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token
      authToken = data.token;
      localStorage.setItem('cosmicToken', authToken);

      // Fetch full user data
      await fetchUserData();

      // Show dashboard
      showDashboard();

    } catch (error) {
      messageDiv.innerHTML = `<div class="cosmic-message error">${error.message}</div>`;
    }
  }

  async function fetchUserData() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) {
        throw new Error('Session expired');
      }

      currentUser = await response.json();
      
      // Update button
      document.getElementById('account-btn').textContent = '✧ ' + (currentUser.name || 'Account');

    } catch (error) {
      // Clear invalid token
      localStorage.removeItem('cosmicToken');
      authToken = null;
      currentUser = null;
    }
  }

  function showDashboard() {
    const modal = document.getElementById('account-modal');
    const body = document.getElementById('account-modal-body');

    const hasLifeEssay = currentUser.has_life_essay;
    const hasYearEssay = currentUser.has_year_essay;
    const hasReadingList = currentUser.has_reading_list;
    const hasSMS = currentUser.subscription_tier === 'sms';

    body.innerHTML = `
      <div class="dashboard-header">
        <h2>✧ Welcome, ${currentUser.name || 'Cosmic Traveler'} ✧</h2>
        <p>Your cosmic dashboard</p>
      </div>

      <div class="cosmic-info-box">
        <h3>Your Cosmic Profile</h3>
        <p><strong>Life Path:</strong> ${currentUser.life_path || 'Not calculated'}</p>
        <p><strong>Sun Sign:</strong> ${currentUser.sun_sign || 'Not calculated'}</p>
        <p><strong>Chinese Zodiac:</strong> ${currentUser.chinese_zodiac || 'Not calculated'}</p>
      </div>

      <h3 style="color: #c9a227; margin-bottom: 15px;">Your Content</h3>

      <div class="product-card">
        <span class="status ${hasLifeEssay ? 'owned' : 'locked'}">${hasLifeEssay ? '✓ Owned' : 'Locked'}</span>
        <h4>Life Essay</h4>
        <p>15 personalized paragraphs exploring your complete cosmic blueprint.</p>
        ${hasLifeEssay 
          ? '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.viewEssay(\'life-essay\')">View Essay</button>'
          : '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.purchase(\'life-essay\')">Purchase - $15</button>'
        }
      </div>

      <div class="product-card">
        <span class="status ${hasYearEssay ? 'owned' : 'locked'}">${hasYearEssay ? '✓ Owned' : 'Locked'}</span>
        <h4>Year Essay</h4>
        <p>5 paragraphs exploring your cosmic influences for the year ahead.</p>
        ${hasYearEssay 
          ? '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.viewEssay(\'year-essay\')">View Essay</button>'
          : '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.purchase(\'year-essay\')">Purchase - $5</button>'
        }
      </div>

      <div class="product-card">
        <span class="status ${hasReadingList ? 'owned' : 'locked'}">${hasReadingList ? '✓ Owned' : 'Locked'}</span>
        <h4>Reading List</h4>
        <p>Curated book recommendations based on your cosmic blueprint.</p>
        ${hasReadingList 
          ? '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.viewEssay(\'reading-list\')">View List</button>'
          : '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.purchase(\'reading-list\')">Purchase - $5</button>'
        }
      </div>

      <div class="product-card">
        <span class="status ${hasSMS ? 'owned' : 'locked'}">${hasSMS ? '✓ Active' : 'Not Subscribed'}</span>
        <h4>Cosmic SMS</h4>
        <p>3x weekly personalized cosmic guidance texts + full site access.</p>
        ${hasSMS 
          ? '<p style="color: #27c93f; font-size: 12px;">✓ All premium content included</p>'
          : '<button class="cosmic-btn cosmic-btn-small" onclick="CosmicAccount.purchase(\'subscribe-sms\')">Subscribe - $10/month</button>'
        }
      </div>

      <button class="cosmic-btn cosmic-btn-secondary" onclick="CosmicAccount.logout()" style="margin-top: 20px;">
        Sign Out
      </button>
    `;

    modal.style.display = 'flex';
  }

  async function viewEssay(type) {
    const essayModal = document.getElementById('essay-modal');
    const essayBody = document.getElementById('essay-modal-body');

    essayBody.innerHTML = '<div class="cosmic-loading">Generating your personalized content</div>';
    essayModal.style.display = 'flex';

    try {
      const response = await fetch(`/api/reading/${type}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load content');
      }

      const data = await response.json();
      const content = data.essay || data.readingList;

      essayBody.innerHTML = `
        <div class="essay-content">${formatEssayContent(content)}</div>
        <button class="cosmic-btn" style="margin-top: 30px;" onclick="CosmicAccount.downloadEssay('${type}')">
          Download as PDF
        </button>
      `;

    } catch (error) {
      essayBody.innerHTML = `
        <div class="cosmic-message error">${error.message}</div>
        <button class="cosmic-btn cosmic-btn-secondary" onclick="document.getElementById('essay-modal').style.display='none'">
          Close
        </button>
      `;
    }
  }

  function formatEssayContent(content) {
    // Convert plain text formatting to HTML
    return content
      .replace(/═+/g, '<hr style="border-color: #c9a227; margin: 20px 0;">')
      .replace(/✧([^✧]+)✧/g, '<h2 style="text-align: center; color: #c9a227;">✧$1✧</h2>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  async function purchase(type) {
    try {
      const response = await fetch(`/api/stripe/${type}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        }
      });

      const data = await response.json();

      if (data.adminBypass) {
        // Admin gets free access - refresh user data
        alert('Admin access granted! Content unlocked.');
        await fetchUserData();
        showDashboard();
        return;
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function logout() {
    localStorage.removeItem('cosmicToken');
    authToken = null;
    currentUser = null;
    document.getElementById('account-btn').textContent = '✧ Account';
    document.getElementById('account-modal').style.display = 'none';
  }

  function downloadEssay(type) {
    // Simple print-to-PDF functionality
    const content = document.querySelector('.essay-content').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cosmic Self - ${type.replace('-', ' ').toUpperCase()}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
            h2 { color: #8B7355; text-align: center; }
            hr { border-color: #8B7355; margin: 30px 0; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Expose functions globally for onclick handlers
  window.CosmicAccount = {
    viewEssay,
    purchase,
    logout,
    downloadEssay
  };

})();
