const https = require('https');
const http = require('http');

const deepgramKey = process.env.DEEPGRAM_API_KEY || '';
const groqKey = process.env.GROQ_API_KEY || '';

// Deepgram balance
console.log('Fetching Deepgram balance...\n');
const deepgramReq = https.get({
  hostname: 'api.deepgram.com',
  path: '/v1/status',
  headers: { 'Authorization': `Token ${deepgramKey}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('=== DEEPGRAM STATUS ===');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log(data);
    }
    console.log('\n');
  });
});

deepgramReq.on('error', e => {
  console.error('Deepgram error:', e.message);
});

// Groq balance - try their API
console.log('Fetching Groq balance...\n');
const groqReq = https.get({
  hostname: 'api.groq.com',
  path: '/openai/v1/models',
  headers: { 'Authorization': `Bearer ${groqKey}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('=== GROQ MODELS/BALANCE ===');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});

groqReq.on('error', e => {
  console.error('Groq error:', e.message);
  console.log('(Groq may not expose balance via API - try checking console.groq.com)');
});
