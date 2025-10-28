#!/usr/bin/env node
/**
 * Mock Backend Server for Q-SCI Extension
 * 
 * This server provides mock API endpoints for local testing:
 * - POST /api/auth/openai-key - Returns a test OpenAI API key
 * - GET /api/auth/subscription-status - Returns subscription status
 * - Serves authentication pages on /extension-login and /extension-auth-success
 * 
 * Usage: node mock-backend-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;
const HOST = 'localhost';

// Mock OpenAI API key for testing (this won't work with real OpenAI API)
// In production, this should be a real key from environment variables
const MOCK_OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-mock-key-for-local-testing-only';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

  // Enable CORS for extension communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint: GET /api/auth/openai-key
  if (pathname === '/api/auth/openai-key' && req.method === 'GET') {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      }));
      return;
    }

    // SECURITY WARNING: This is a MOCK server for LOCAL TESTING ONLY
    // In production, verify the token with Clerk or your auth provider
    // DO NOT deploy this mock server to production!
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  CRITICAL: Mock server should not be used in production!');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Configuration Error',
        message: 'Mock server cannot be used in production'
      }));
      return;
    }

    // In mock mode, accept any bearer token
    // In production, verify with Clerk
    console.log('✅ OpenAI API key requested - returning mock key');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      api_key: MOCK_OPENAI_API_KEY
    }));
    return;
  }

  // API endpoint: GET /api/auth/subscription-status
  if (pathname === '/api/auth/subscription-status' && req.method === 'GET') {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      }));
      return;
    }

    // SECURITY WARNING: This is a MOCK server for LOCAL TESTING ONLY
    // In production, verify the token with Clerk or your auth provider
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  CRITICAL: Mock server should not be used in production!');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Configuration Error',
        message: 'Mock server cannot be used in production'
      }));
      return;
    }

    // In mock mode, return 'free' status
    // In production, check Clerk metadata
    console.log('✅ Subscription status requested - returning free tier');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      subscription_status: 'free'
    }));
    return;
  }

  // Serve authentication pages
  if (pathname === '/extension-login' || pathname === '/extension-login.html') {
    const filePath = path.join(__dirname, 'website', 'extension-login.html');
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
    return;
  }

  if (pathname === '/extension-auth-success' || pathname === '/extension-auth-success.html') {
    const filePath = path.join(__dirname, 'website', 'extension-auth-success.html');
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
    return;
  }

  // Root endpoint - show server info
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Q-SCI Mock Backend Server</title>
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
    .warning {
      background: #fef3c7;
      color: #92400e;
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
    <h1>🧪 Q-SCI Mock Backend Server</h1>
    
    <div class="status">
      ✅ Server is running on <code>http://localhost:${PORT}</code>
    </div>

    <div class="warning">
      ⚠️ <strong>This is a MOCK server for LOCAL TESTING ONLY</strong><br>
      It provides fake API responses for development purposes.
    </div>

    <div class="info">
      <strong>Available API endpoints:</strong>
      <ul>
        <li><code>GET /api/auth/openai-key</code> - Returns mock OpenAI API key</li>
        <li><code>GET /api/auth/subscription-status</code> - Returns subscription status</li>
      </ul>
      
      <strong>Authentication pages:</strong>
      <ul>
        <li><a href="/extension-login">/extension-login</a> - Clerk authentication page</li>
        <li><a href="/extension-auth-success">/extension-auth-success</a> - Authentication success callback</li>
      </ul>
    </div>

    <h2>Configuration</h2>
    <p>Make sure your extension is configured to use:</p>
    <ul>
      <li><strong>API Base URL:</strong> <code>http://localhost:${PORT}/api</code></li>
      <li><strong>Auth URL:</strong> <code>http://localhost:${PORT}/extension-login</code></li>
    </ul>

    <h2>Testing</h2>
    <ol>
      <li>Start this mock backend server</li>
      <li>Update extension configuration to use localhost URLs</li>
      <li>Build and load the extension</li>
      <li>Test authentication and analysis features</li>
    </ol>

    <h2>Server Logs</h2>
    <p>Check the terminal where you started this server to see request logs.</p>
  </div>
</body>
</html>
    `);
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Q-SCI Mock Backend Server                                    ║');
  console.log('║  FOR LOCAL TESTING ONLY                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running at http://${HOST}:${PORT}/`);
  console.log('');
  console.log('📍 API endpoints:');
  console.log(`   • GET  http://${HOST}:${PORT}/api/auth/openai-key`);
  console.log(`   • GET  http://${HOST}:${PORT}/api/auth/subscription-status`);
  console.log('');
  console.log('📍 Authentication pages:');
  console.log(`   • http://${HOST}:${PORT}/extension-login`);
  console.log(`   • http://${HOST}:${PORT}/extension-auth-success`);
  console.log('');
  console.log('📝 Open http://localhost:5000/ in your browser for instructions');
  console.log('');
  console.log('⚠️  Using mock OpenAI key:', MOCK_OPENAI_API_KEY.substring(0, 20) + '...');
  console.log('   Set OPENAI_API_KEY environment variable to use real key');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error(`   Please stop any other server running on port ${PORT}`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
