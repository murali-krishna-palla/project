const https = require('https');

const deepgramKey = process.env.DEEPGRAM_API_KEY || '';
const projectId = '1f2b491a-0eb2-44f4-a2d0-c21ca237d369';

const endpoints = [
  `/v1/projects/${projectId}`,
  `/v1/projects/${projectId}/usage`,
  `/v1/projects/${projectId}/billing`,
  `/v1/projects/${projectId}/balance`,
  `/v1/billing`,
  `/v1/usage`,
  `/v1/balance`
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
      console.log(`\n=== ${path} ===`);
      console.log(`Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2).substring(0, 1000));
      } catch(e) {
        console.log(data.substring(0, 500) || '(empty)');
      }
      completed++;
    });
  });
  
  req.on('error', e => {
    console.log(`\n=== ${path} ===`);
    console.log(`Error: ${e.message}`);
    completed++;
  });
});

setTimeout(() => {
  if (completed < endpoints.length) {
    console.log(`\n⏳ Waiting for ${endpoints.length - completed} more requests...`);
    setTimeout(() => {
      console.log('⏱️ Timeout - checked all available endpoints');
      process.exit(0);
    }, 5000);
  } else {
    process.exit(0);
  }
}, 15000);
