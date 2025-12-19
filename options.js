// Q‑SCI Options page script

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n first
  if (window.QSCIi18n) {
    await window.QSCIi18n.init();
    window.QSCIi18n.translatePage();
    
    // Setup language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
      languageSelector.value = window.QSCIi18n.getLanguage();
      languageSelector.addEventListener('change', async function(e) {
        await window.QSCIi18n.setLanguage(e.target.value);
        document.documentElement.lang = e.target.value;
        window.QSCIi18n.translatePage();
        
        // Re-render dynamic content after language change
        await updateAuthStatus();
        await updateSubscriptionInfo();
        await updateUsageStats();
      });
    }
  }
  
  const statusEl = document.getElementById('status');
  const authStatusEl = document.getElementById('auth-status');
  const usageStatsEl = document.getElementById('usage-stats');
  const refreshSubscriptionBtn = document.getElementById('refreshSubscriptionBtn');
  const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');

  // Note: API key management has been removed as it's now handled by the backend
  // Users no longer need to manually enter their OpenAI API keys

  // Refresh subscription button handler
  if (refreshSubscriptionBtn) {
    refreshSubscriptionBtn.addEventListener('click', async () => {
      refreshSubscriptionBtn.disabled = true;
      const originalText = refreshSubscriptionBtn.textContent;
      refreshSubscriptionBtn.textContent = '⏳ ' + window.QSCIi18n.t('message.analyzing');
      
      try {
        await window.QSCIAuth.refreshSubscriptionStatus();
        await updateAuthStatus();
        await updateSubscriptionInfo();
        showStatus(window.QSCIi18n.t('settings.cancelSubscriptionSuccess'), 'success');
      } catch (error) {
        console.error('Error refreshing subscription:', error);
        showStatus(window.QSCIi18n.t('settings.cancelSubscriptionError'), 'error');
      } finally {
        refreshSubscriptionBtn.disabled = false;
        refreshSubscriptionBtn.textContent = originalText;
      }
    });
  }

  // Cancel subscription button handler
  if (cancelSubscriptionBtn) {
    cancelSubscriptionBtn.addEventListener('click', async () => {
      // Show confirmation dialog
      const confirmed = confirm(window.QSCIi18n.t('settings.cancelSubscriptionConfirm'));
      
      if (!confirmed) {
        return;
      }
      
      cancelSubscriptionBtn.disabled = true;
      const originalText = cancelSubscriptionBtn.textContent;
      cancelSubscriptionBtn.textContent = '⏳ ' + window.QSCIi18n.t('message.analyzing');
      
      try {
        await window.QSCIAuth.cancelSubscription();
        await updateAuthStatus();
        await updateSubscriptionInfo();
        showStatus(window.QSCIi18n.t('settings.cancelSubscriptionSuccess'), 'success');
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        showStatus(error.message || window.QSCIi18n.t('settings.cancelSubscriptionError'), 'error');
      } finally {
        cancelSubscriptionBtn.disabled = false;
        cancelSubscriptionBtn.textContent = originalText;
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
  const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');
  
  try {
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    
    if (isLoggedIn) {
      const user = await window.QSCIAuth.getCurrentUser();
      const status = user.subscriptionStatus || 'free';
      
      let statusBadge, dailyLimit, tipMessage;
      
      if (status === 'subscribed') {
        statusBadge = '<span style="padding: 2px 8px; border-radius: 3px; background: #dcfce7; color: #166534; font-weight: 500;">✓ Premium</span>';
        dailyLimit = '100';
        tipMessage = '';
        // Show cancel button for subscribed users
        if (cancelSubscriptionBtn) {
          cancelSubscriptionBtn.style.display = 'inline-block';
        }
      } else if (status === 'past_due') {
        statusBadge = '<span style="padding: 2px 8px; border-radius: 3px; background: #fef3c7; color: #92400e; font-weight: 500;">⚠ Payment Due</span>';
        dailyLimit = '10';
        tipMessage = '<div style="margin-top: 8px; color: #b91c1c;"><strong>⚠ Action Required:</strong> Please update your payment method to restore Premium access.</div>';
        // Hide cancel button for past_due users
        if (cancelSubscriptionBtn) {
          cancelSubscriptionBtn.style.display = 'none';
        }
      } else {
        statusBadge = '<span style="padding: 2px 8px; border-radius: 3px; background: #f3f4f6; color: #6b7280; font-weight: 500;">Free</span>';
        dailyLimit = '10';
        tipMessage = '<div style="margin-top: 8px; color: #92400e;"><strong>💡 Tip:</strong> Upgrade to Premium for 10x more analyses per day!</div>';
        // Hide cancel button for free users
        if (cancelSubscriptionBtn) {
          cancelSubscriptionBtn.style.display = 'none';
        }
      }
      
      subscriptionInfoEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Current Plan</div>
        <div style="margin-bottom: 8px;">
          <strong>Status:</strong> ${statusBadge}
        </div>
        <div><strong>Daily analyses:</strong> ${dailyLimit}</div>
        ${tipMessage}
      `;
    } else {
      subscriptionInfoEl.innerHTML = `
        <div>Login to view subscription information.</div>
      `;
      // Hide cancel button when not logged in
      if (cancelSubscriptionBtn) {
        cancelSubscriptionBtn.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading subscription info:', error);
    subscriptionInfoEl.innerHTML = `
      <div>Unable to load subscription information.</div>
    `;
    // Hide cancel button on error
    if (cancelSubscriptionBtn) {
      cancelSubscriptionBtn.style.display = 'none';
    }
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