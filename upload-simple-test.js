#!/usr/bin/env node

// Script to upload simple-test project to the API

const fs = require('fs');
const https = require('https');

const API_BASE = 'https://dev-platform-eight.vercel.app/api';
const USER_ID = 'test-user';
const PROJECT_ID = 'simple-test';

// Read files
const diagram = JSON.parse(fs.readFileSync('simple-test/diagram.json', 'utf8'));
const code = fs.readFileSync('simple-test/simple-test.ino', 'utf8');

// Create project payload
const payload = JSON.stringify({
  projectId: PROJECT_ID,
  name: 'Simple Test Project',
  diagram: diagram,
  code: code
});

const options = {
  hostname: 'dev-platform-eight.vercel.app',
  port: 443,
  path: `/api/projects/${USER_ID}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

console.log('Uploading simple-test project...');
console.log(`POST ${API_BASE}/projects/${USER_ID}`);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✅ Project uploaded successfully!');
      console.log('\nNow test the endpoints:');
      console.log(`  GET ${API_BASE}/projects/${USER_ID}`);
      console.log(`  GET ${API_BASE}/projects/${USER_ID}/${PROJECT_ID}`);
      console.log(`  GET ${API_BASE}/projects/${USER_ID}/${PROJECT_ID}/diagram`);
      console.log(`  GET ${API_BASE}/projects/${USER_ID}/${PROJECT_ID}/code`);
    } else {
      console.log('\n❌ Upload failed');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(payload);
req.end();
