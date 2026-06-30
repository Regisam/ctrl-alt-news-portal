const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Starting ultra-simple server...');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Serve index.html for all other requests
  const filePath = path.join(__dirname, 'dist/public/index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('File read error:', err);
      res.writeHead(500);
      res.end('Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('📁 Serving from:', path.join(__dirname, 'dist/public'));
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
