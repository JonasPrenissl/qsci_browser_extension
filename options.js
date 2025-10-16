// Q‑SCI Options page script

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const statusEl = document.getElementById('status');

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
      statusEl.textContent = 'API key saved.';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);
    });
  });
});