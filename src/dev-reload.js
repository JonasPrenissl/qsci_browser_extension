// Dev Reload Client
// Include this in your service worker (and popup/options if you want those to hot reload too)
(() => {
  // Don't run in production package
  if (!/localhost|127\.0\.0\.1/.test(location.host)) return;
  try {
    const ws = new WebSocket("ws://localhost:35729");
    ws.onmessage = (e) => {
      if (e.data === "reload-extension") {
        // Reload the extension (service worker + content scripts)
        chrome.runtime.reload();
      }
    };
  } catch (e) {
    // ignore when server isn't running
  }
})();
