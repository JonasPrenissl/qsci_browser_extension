// Q‑SCI Options page script

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const statusEl = document.getElementById('status');
  const authStatusEl = document.getElementById('auth-status');
  const usageStatsEl = document.getElementById('usage-stats');
  const refreshSubscriptionBtn = document.getElementById('refreshSubscriptionBtn');

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

  // Refresh subscription button handler
  if (refreshSubscriptionBtn) {
    refreshSubscriptionBtn.addEventListener('click', async () => {
      refreshSubscriptionBtn.disabled = true;
      refreshSubscriptionBtn.textContent = '⏳ Refreshing...';
      
      try {
        await window.QSCIAuth.refreshSubscriptionStatus();
        await updateAuthStatus();
        await updateSubscriptionInfo();
        showStatus('Subscription status refreshed successfully!', 'success');
      } catch (error) {
        console.error('Error refreshing subscription:', error);
        showStatus('Failed to refresh subscription status.', 'error');
      } finally {
        refreshSubscriptionBtn.disabled = false;
        refreshSubscriptionBtn.textContent = '🔄 Refresh Subscription Status';
      }
    });
  }

  // Load and display auth status
  await updateAuthStatus();
  await updateSubscriptionInfo();
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

async function updateSubscriptionInfo() {
  const subscriptionInfoEl = document.getElementById('subscription-info');
  
  try {
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    
    if (isLoggedIn) {
      const user = await window.QSCIAuth.getCurrentUser();
      const isSubscribed = user.subscriptionStatus === 'subscribed';
      
      subscriptionInfoEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Current Plan</div>
        <div style="margin-bottom: 8px;">
          <strong>Status:</strong> 
          <span style="padding: 2px 8px; border-radius: 3px; ${isSubscribed ? 'background: #dcfce7; color: #166534;' : 'background: #f3f4f6; color: #6b7280;'} font-weight: 500;">
            ${isSubscribed ? '✓ Premium' : 'Free'}
          </span>
        </div>
        <div><strong>Daily analyses:</strong> ${isSubscribed ? '100' : '10'}</div>
        ${!isSubscribed ? '<div style="margin-top: 8px; color: #92400e;"><strong>💡 Tip:</strong> Upgrade to Premium for 10x more analyses per day!</div>' : ''}
      `;
    } else {
      subscriptionInfoEl.innerHTML = `
        <div>Login to view subscription information.</div>
      `;
    }
  } catch (error) {
    console.error('Error loading subscription info:', error);
    subscriptionInfoEl.innerHTML = `
      <div>Unable to load subscription information.</div>
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