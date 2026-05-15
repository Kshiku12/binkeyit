const http = require('http');

const data = JSON.stringify({ idToken: "dummy_token" });

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/api/v2/auth/google',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(`Response: ${body}`));
});

req.on('error', (e) => console.error(`Error: ${e.message}`));
req.write(data);
req.end();
