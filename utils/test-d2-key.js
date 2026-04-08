const https = require('https');

const testKey = '2ee987a09d9e1137a837325d36d8c3c59bbb5f60';

console.log('Testing API key:', testKey);
console.log('Key format suggests: D2 / Deepgram / or other service\n');

// Try Deepgram
console.log('=== Testing as Deepgram Token ===');
const deepgramReq = https.get({
  hostname: 'api.deepgram.com',
  path: '/v1/projects',
  headers: { 'Authorization': `Token ${testKey}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ VALID - Deepgram Tokens found:');
        console.log(JSON.stringify(parsed, null, 2).substring(0, 500));
      } catch(e) {
        console.log(data.substring(0, 300));
      }
    } else {
      console.log('❌ Not a valid Deepgram key');
    }
  });
});

deepgramReq.on('error', e => {
  console.log('Error:', e.message);
});
