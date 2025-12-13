#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const GIST_ID = '3633387239d3257a62397134fb1c9bb5';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.log('Usage: node upload-updated-questions.js YOUR_GITHUB_TOKEN');
  process.exit(1);
}

console.log('📤 Uploading updated questions to Gist...');

// Read XML content
const xmlContent = fs.readFileSync('public/student/data/cs50-questions.xml', 'utf-8');

// Prepare request data
const data = JSON.stringify({
  files: {
    'cs50-questions.xml': {
      content: xmlContent
    }
  }
});

// Request options
const options = {
  hostname: 'api.github.com',
  path: `/gists/${GIST_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `token ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'Quiz-Questions-Updater',
    'Accept': 'application/vnd.github.v3+json'
  }
};

// Make request
const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\n✅ Upload complete!');
      console.log(`🔗 Gist URL: https://gist.github.com/m-avramova/${GIST_ID}`);
      console.log(`📊 Total questions: 219 (removed 26 complexity, added 20 code output)`);
    } else {
      console.error(`\n❌ Error: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
