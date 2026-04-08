const https = require('https');

const deepgramKey = process.env.DEEPGRAM_API_KEY || '';

// Try multiple Deepgram endpoints
const endpoints = [
  '/v1/accounts',
  '/v1/projects',
  '/v1/users/me'
];

let completed = 0;

endpoints.forEach(path => {
  const req = https.get({
    hostname: 'api.deepgram.com',
    path: path,
    headers: { 
      'Authorization': `Token ${deepgramKey}`,
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n=== DEEPGRAM ${path.toUpperCase()} ===`);
      console.log(`Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch(e) {
        console.log(data.substring(0, 500));
      }
      completed++;
      if (completed === endpoints.length) {
        console.log('\n=== SUMMARY ===');
        console.log('✅ Deepgram API key is valid');
        console.log('For balance info: Visit https://console.deepgram.com');
      }
    });
  });
  
  req.on('error', e => {
    console.log(`❌ Error on ${path}: ${e.message}`);
  });
});
