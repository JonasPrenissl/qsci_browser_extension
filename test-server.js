#!/usr/bin/env node
/**
 * Simple HTTP server for testing Clerk authentication redirect flow locally
 * 
 * This server serves the authentication pages needed for the extension to work:
 * - http://localhost:3000/extension-login
 * - http://localhost:3000/extension-auth-success
 * 
 * Usage: node test-server.js
 * 
 * After starting the server:
 * 1. Update auth.js to use 'http://localhost:3000/extension-login'
 * 2. Reload the extension
 * 3. Test the login flow
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Enable CORS for extension communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route handlers
  let filePath = null;
  
  if (req.url === '/extension-login' || req.url === '/extension-login.html') {
    filePath = path.join(__dirname, 'website', 'extension-login.html');
  } else if (req.url === '/extension-auth-success' || req.url === '/extension-auth-success.html') {
    filePath = path.join(__dirname, 'website', 'extension-auth-success.html');
  } else if (req.url === '/' || req.url === '/index.html') {
    // Serve a simple index page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Q-SCI Extension Test Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #667eea;
      margin-bottom: 20px;
    }
    .status {
      background: #d1fae5;
      color: #065f46;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .info {
      background: #eff6ff;
      color: #1e40af;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Q-SCI Extension Test Server</h1>
    
    <div class="status">
      ✅ Server is running on <code>http://localhost:${PORT}</code>
    </div>

    <div class="info">
      <strong>Available endpoints:</strong>
      <ul>
        <li><a href="/extension-login">/extension-login</a> - Clerk authentication page</li>
        <li><a href="/extension-auth-success">/extension-auth-success</a> - Authentication success callback</li>
      </ul>
    </div>

    <h2>Testing Instructions</h2>
    <ol>
      <li>This server is serving the authentication pages for local testing</li>
      <li>For production, deploy these pages to <code>https://www.q-sci.org</code></li>
      <li>The extension popup will open the login page in a new window</li>
      <li>After authentication, the success page sends token back via postMessage</li>
    </ol>

    <h2>Current Configuration</h2>
    <p>The extension is configured to use:</p>
    <ul>
      <li><strong>Login URL:</strong> <code>https://www.q-sci.org/extension-login</code></li>
      <li><strong>Success URL:</strong> <code>https://www.q-sci.org/extension-auth-success</code></li>
    </ul>

    <p><strong>Note:</strong> For local testing, you would need to update <code>auth.js</code> to use <code>http://localhost:${PORT}</code> instead.</p>

    <h2>Server Logs</h2>
    <p>Check the terminal where you started this server to see request logs.</p>
  </div>
</body>
</html>
    `);
    return;
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  // Serve the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Q-SCI Extension Authentication Test Server                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running at http://${HOST}:${PORT}/`);
  console.log('');
  console.log('📍 Available endpoints:');
  console.log(`   • http://${HOST}:${PORT}/extension-login`);
  console.log(`   • http://${HOST}:${PORT}/extension-auth-success`);
  console.log('');
  console.log('📝 Open http://localhost:3000/ in your browser for instructions');
  console.log('');
  console.log('⚠️  Note: This is for LOCAL TESTING ONLY');
  console.log('   For production, deploy to https://www.q-sci.org');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error(`   Please stop any other server running on port ${PORT} or choose a different port`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
