#!/usr/bin/env node
/**
 * Test script for the project API.
 * Usage: node scripts/test-projects-api.mjs [API_BASE]
 * Default API_BASE: https://dev-platform-eight.vercel.app/api
 */

const API_BASE = process.env.API_BASE || process.argv[2] || 'https://dev-platform-eight.vercel.app/api';
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_PROJECT_ID = 'test-project-' + Date.now();

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const opts = { method, headers: {} };
  if (body !== null) {
    opts.headers['Content-Type'] = typeof body === 'string' ? 'text/plain' : 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch (_) {
    // keep as string for non-JSON (e.g. code)
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('API_BASE:', API_BASE);
  console.log('TEST_USER_ID:', TEST_USER_ID);
  console.log('TEST_PROJECT_ID:', TEST_PROJECT_ID);
  console.log('---');

  // 1. GET list (expect 200, may be empty)
  const listRes = await request('GET', `/projects/${TEST_USER_ID}`);
  console.log('GET /projects/{userId} (list):', listRes.status, listRes.ok ? 'OK' : 'FAIL', JSON.stringify(listRes.data).slice(0, 120));
  if (!listRes.ok && listRes.status !== 404) {
    console.error('List failed. Is the API deployed and BLOB_READ_WRITE_TOKEN set?');
    process.exitCode = 1;
    return;
  }

  // 2. POST create
  const createBody = {
    projectId: TEST_PROJECT_ID,
    name: 'Test project',
    diagram: { version: 1, parts: [] },
    code: '// test\nvoid setup() {} void loop() {}',
  };
  const createRes = await request('POST', `/projects/${TEST_USER_ID}`, createBody);
  console.log('POST /projects/{userId} (create):', createRes.status, createRes.ok ? 'OK' : 'FAIL', JSON.stringify(createRes.data).slice(0, 120));
  if (!createRes.ok) {
    console.error('Create failed:', createRes.data);
    process.exitCode = 1;
    return;
  }

  // 3. GET project
  const getRes = await request('GET', `/projects/${TEST_USER_ID}/${TEST_PROJECT_ID}`);
  console.log('GET /projects/{userId}/{projectId}:', getRes.status, getRes.ok ? 'OK' : 'FAIL', JSON.stringify(getRes.data).slice(0, 120));

  // 4. GET diagram
  const diagramRes = await request('GET', `/projects/${TEST_USER_ID}/${TEST_PROJECT_ID}/diagram`);
  console.log('GET .../diagram:', diagramRes.status, diagramRes.ok ? 'OK' : 'FAIL', typeof diagramRes.data === 'object' ? JSON.stringify(diagramRes.data).slice(0, 80) : String(diagramRes.data).slice(0, 80));

  // 5. GET code
  const codeRes = await request('GET', `/projects/${TEST_USER_ID}/${TEST_PROJECT_ID}/code`);
  console.log('GET .../code:', codeRes.status, codeRes.ok ? 'OK' : 'FAIL', typeof codeRes.data === 'string' ? codeRes.data.slice(0, 60) : JSON.stringify(codeRes.data).slice(0, 60));

  console.log('---');
  console.log('Done. All project API endpoints exercised.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
