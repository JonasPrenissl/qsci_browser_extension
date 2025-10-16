// Q‑SCI Options page script

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const statusEl = document.getElementById('status');
  const authStatusEl = document.getElementById('auth-status');
  const usageStatsEl = document.getElementById('usage-stats');

  // Load existing key from storage
  chrome.storage.local.get('openai_api_key', (result) => {
    if (result && result.openai_api_key) {
      apiKeyInput.value = result.openai_api_key;
    }
  });

  // Save API key on button click
  document.getElementById('saveBtn').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    chrome.storage.local.set({ openai_api_key: key }, () => {
      showStatus('API key saved successfully.', 'success');
    });
  });

  // Load and display auth status
  await updateAuthStatus();
  await updateUsageStats();
});

async function updateAuthStatus() {
  const authStatusEl = document.getElementById('auth-status');
  
  try {
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    
    if (isLoggedIn) {
      const user = await window.QSCIAuth.getCurrentUser();
      
      authStatusEl.className = 'auth-status';
      authStatusEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">✓ Logged In</div>
        <div><strong>Email:</strong> ${user.email}</div>
        <div><strong>Subscription:</strong> ${user.subscriptionStatus === 'subscribed' ? '✓ Subscribed' : 'Free'}</div>
      `;
    } else {
      authStatusEl.className = 'auth-status logged-out';
      authStatusEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">✗ Not Logged In</div>
        <div>Please login through the extension popup to use Q-SCI analysis features.</div>
      `;
    }
  } catch (error) {
    console.error('Error loading auth status:', error);
    authStatusEl.className = 'auth-status logged-out';
    authStatusEl.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Error</div>
      <div>Unable to load authentication status.</div>
    `;
  }
}

async function updateUsageStats() {
  const usageStatsEl = document.getElementById('usage-stats');
  
  try {
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    
    if (isLoggedIn) {
      const user = await window.QSCIAuth.getCurrentUser();
      const usageInfo = await window.QSCIUsage.canAnalyze(user.subscriptionStatus);
      
      usageStatsEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Today's Usage</div>
        <div><strong>Analyses performed:</strong> ${usageInfo.used} / ${usageInfo.limit}</div>
        <div><strong>Remaining:</strong> ${usageInfo.remaining}</div>
      `;
    } else {
      usageStatsEl.innerHTML = `
        <div>Login to view usage statistics.</div>
      `;
    }
  } catch (error) {
    console.error('Error loading usage stats:', error);
    usageStatsEl.innerHTML = `
      <div>Unable to load usage statistics.</div>
    `;
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = type;
  
  setTimeout(() => {
    statusEl.style.display = 'none';
    statusEl.className = '';
  }, 3000);
}