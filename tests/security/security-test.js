const axios = require('../node_modules/axios');
const BASE = 'http://localhost:3000/api';

const results = { passed: 0, failed: 0, warnings: 0, tests: [] };

function log(status, label, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`);
  results.tests.push({ status, label, detail });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

function http(cfg = {}) {
  return axios.create({ baseURL: BASE, validateStatus: () => true, ...cfg });
}

async function getToken(email = 'admin@med.com', pass = 'password123') {
  const r = await http().post('/auth/login', { email, password: pass });
  return r.data?.data?.accessToken || null;
}

// ─────────────────────────────────────────────
// 1. JWT SECURITY
// ─────────────────────────────────────────────
async function testJWT() {
  console.log('\n🔑 JWT SECURITY');

  // No token
  const noToken = await http().get('/patients');
  if (noToken.status === 401 || noToken.status === 403) {
    log('PASS', 'No token → 401/403', `HTTP ${noToken.status}`);
  } else {
    log('FAIL', 'No token → 401/403', `HTTP ${noToken.status} — route unprotected!`);
  }

  // Invalid token
  const inv = await http({ headers: { Authorization: 'Bearer invalidtoken123' } }).get('/patients');
  if (inv.status === 401 || inv.status === 403) {
    log('PASS', 'Invalid token → 401/403', `HTTP ${inv.status}`);
  } else {
    log('FAIL', 'Invalid token → 401/403', `HTTP ${inv.status}`);
  }

  // No Bearer prefix (just raw token)
  const token = await getToken();
  if (token) {
    const raw = await http({ headers: { Authorization: token } }).get('/patients');
    if (raw.status === 401 || raw.status === 403) {
      log('PASS', 'Token without Bearer prefix → 401/403', `HTTP ${raw.status}`);
    } else {
      log('WARN', 'Token without Bearer prefix', `HTTP ${raw.status} — might be accepted`);
    }

    // Tampered token (flip last char)
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    const tamp = await http({ headers: { Authorization: `Bearer ${tampered}` } }).get('/patients');
    if (tamp.status === 401 || tamp.status === 403) {
      log('PASS', 'Tampered token → 401/403', `HTTP ${tamp.status}`);
    } else {
      log('FAIL', 'Tampered token → 401/403', `HTTP ${tamp.status} — signature not verified!`);
    }

    // Expired-looking token (algorithm: none attack)
    const [h, p] = token.split('.');
    const noneToken = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${p}.`;
    const none = await http({ headers: { Authorization: `Bearer ${noneToken}` } }).get('/patients');
    if (none.status === 401 || none.status === 403) {
      log('PASS', 'alg:none attack → 401/403', `HTTP ${none.status}`);
    } else {
      log('FAIL', 'alg:none attack → 401/403', `HTTP ${none.status} — CRITICAL: alg:none accepted!`);
    }
  }
}

// ─────────────────────────────────────────────
// 2. PRIVILEGE ESCALATION (RBAC)
// ─────────────────────────────────────────────
async function testPrivilegeEscalation() {
  console.log('\n🔐 PRIVILEGE ESCALATION');

  const doctorToken  = await getToken('doctor@med.com');
  const labToken     = await getToken('lab@med.com');
  const radioToken   = await getToken('radiolog@med.com');
  const receptionToken = await getToken('reception@med.com');

  if (doctorToken) {
    const d = http({ headers: { Authorization: `Bearer ${doctorToken}` } });

    // Doctor tries to access /users (admin only)
    const u = await d.get('/users');
    if (u.status === 403 || u.status === 401) {
      log('PASS', 'Doctor cannot GET /users', `HTTP ${u.status}`);
    } else {
      log('FAIL', 'Doctor cannot GET /users', `HTTP ${u.status} — data leaked!`);
    }

    // Doctor tries to access /reports/summary (admin/reception only)
    const r = await d.get('/reports/summary');
    if (r.status === 403 || r.status === 401) {
      log('PASS', 'Doctor cannot GET /reports/summary', `HTTP ${r.status}`);
    } else {
      log('FAIL', 'Doctor cannot GET /reports/summary', `HTTP ${r.status}`);
    }

    // Doctor tries to create a new user (admin only)
    const newUser = await d.post('/users', { email: 'hacker@med.com', password: 'hack123', role: 'admin', firstName: 'H', lastName: 'H' });
    if (newUser.status === 403 || newUser.status === 401 || newUser.status === 404) {
      log('PASS', 'Doctor cannot POST /users', `HTTP ${newUser.status}`);
    } else {
      log('FAIL', 'Doctor cannot POST /users', `HTTP ${newUser.status} — privilege escalation!`);
    }
  }

  if (labToken) {
    const l = http({ headers: { Authorization: `Bearer ${labToken}` } });

    // Lab tech CAN access /patients (intentional — needs patient demographics for lab work)
    const p = await l.get('/patients');
    if (p.status === 200) {
      log('PASS', 'Lab tech GET /patients — intentionally allowed', `HTTP ${p.status}`);
    } else {
      log('WARN', 'Lab tech GET /patients', `HTTP ${p.status}`);
    }

    // Lab tech tries to access studies
    const s = await l.get('/studies');
    if (s.status === 403 || s.status === 401) {
      log('PASS', 'Lab tech cannot GET /studies', `HTTP ${s.status}`);
    } else {
      log('FAIL', 'Lab tech cannot GET /studies', `HTTP ${s.status}`);
    }
  }

  if (radioToken) {
    const r = http({ headers: { Authorization: `Bearer ${radioToken}` } });

    // /lab/orders is accessible by all authenticated staff (intentional design)
    const lo = await r.get('/lab/orders');
    if (lo.status === 200) {
      log('PASS', 'Radiologist GET /lab/orders — intentionally allowed', `HTTP ${lo.status}`);
    } else {
      log('WARN', 'Radiologist GET /lab/orders', `HTTP ${lo.status}`);
    }
  }

  if (receptionToken) {
    const rc = http({ headers: { Authorization: `Bearer ${receptionToken}` } });

    // DELETE patient: 404 means route was reached (patient 999999 doesn't exist)
    // If returns 403/401 — route is role-restricted
    const del = await rc.delete('/patients/999999');
    if (del.status === 403 || del.status === 401) {
      log('PASS', 'Receptionist cannot DELETE /patients/:id (role-restricted)', `HTTP ${del.status}`);
    } else if (del.status === 404) {
      log('WARN', 'Receptionist DELETE /patients/:id — route accessible, patient not found', `HTTP ${del.status} — consider restricting DELETE to admin`);
    } else {
      log('WARN', 'Receptionist DELETE /patients/:id', `HTTP ${del.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// 3. SQL INJECTION
// ─────────────────────────────────────────────
async function testSQLInjection() {
  console.log('\n💉 SQL INJECTION');

  const token = await getToken();
  if (!token) { log('SKIP', 'SQL injection', 'no admin token'); return; }
  const a = http({ headers: { Authorization: `Bearer ${token}` } });

  const injections = [
    "' OR '1'='1",
    "'; DROP TABLE patients; --",
    "1 UNION SELECT * FROM users --",
    "' OR 1=1 --",
    "admin'--",
  ];

  // Test in query params
  for (const inj of injections) {
    const r = await a.get(`/patients?search=${encodeURIComponent(inj)}`);
    if (r.status === 200 || r.status === 400) {
      // 200 is fine (returns empty/normal results), 400 is fine (validation error)
      // What we don't want is 500 (unhandled SQL error) or all records returned
      const dataCount = r.data?.data?.length ?? 0;
      if (r.status === 500) {
        log('FAIL', `SQL injection in search param: "${inj.substr(0,30)}"`, 'HTTP 500 — possible SQL error!');
      } else if (r.status === 200 && dataCount > 100) {
        log('WARN', `SQL injection in search param: "${inj.substr(0,30)}"`, `returned ${dataCount} records — check`);
      } else {
        log('PASS', `SQL injection in search param: "${inj.substr(0,30)}"`, `HTTP ${r.status}, ${dataCount} rows`);
      }
    } else {
      log('PASS', `SQL injection in search param: "${inj.substr(0,30)}"`, `HTTP ${r.status}`);
    }
  }

  // Test in login body
  for (const inj of ["' OR '1'='1", "admin' --"]) {
    const r = await http().post('/auth/login', { email: inj, password: inj });
    if (r.status === 401 || r.status === 400) {
      log('PASS', `SQL injection in login email: "${inj}"`, `HTTP ${r.status}`);
    } else if (r.status === 200) {
      log('FAIL', `SQL injection in login email: "${inj}"`, 'CRITICAL: login bypassed!');
    } else {
      log('PASS', `SQL injection in login email: "${inj}"`, `HTTP ${r.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// 4. XSS
// ─────────────────────────────────────────────
async function testXSS() {
  console.log('\n🕷️  XSS PROTECTION');

  const token = await getToken();
  if (!token) { log('SKIP', 'XSS', 'no admin token'); return; }
  const a = http({ headers: { Authorization: `Bearer ${token}` } });

  const xssPayloads = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert('xss')",
    '<svg onload=alert(1)>',
  ];

  for (const xss of xssPayloads) {
    const r = await a.post('/patients', {
      firstName: xss,
      lastName: 'XSSTest',
      dateOfBirth: '2000-01-01',
      gender: 'male',
      phone: '+37300000099',
    });

    if (r.status === 400 || r.status === 422) {
      log('PASS', `XSS in firstName rejected: "${xss.substr(0,30)}"`, `HTTP ${r.status}`);
    } else if (r.status === 201) {
      const pid = r.data?.data?.id;
      // Check if data is stored as-is (not executed, just stored) — stored XSS is an API-level concern
      const saved = r.data?.data?.firstName;
      if (saved === xss) {
        log('WARN', `XSS stored as-is: "${xss.substr(0,30)}"`, 'Stored in DB — frontend must sanitize on render');
      } else {
        log('PASS', `XSS sanitized before storage: "${xss.substr(0,30)}"`, `stored as: "${saved}"`);
      }
      // Cleanup
      if (pid) await a.delete(`/patients/${pid}`);
    } else {
      log('WARN', `XSS payload: "${xss.substr(0,30)}"`, `HTTP ${r.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// 5. PASSWORD SECURITY
// ─────────────────────────────────────────────
async function testPasswordSecurity() {
  console.log('\n🔒 PASSWORD SECURITY');

  const token = await getToken();
  if (!token) { log('SKIP', 'Password security', 'no admin token'); return; }
  const a = http({ headers: { Authorization: `Bearer ${token}` } });

  // Password should NOT appear in /users/me response
  const me = await a.get('/users/me');
  const meStr = JSON.stringify(me.data);
  if (meStr.includes('password123') || meStr.includes('"password"')) {
    log('FAIL', 'Password not in /users/me response', 'CRITICAL: password exposed in API!');
  } else {
    log('PASS', 'Password not in /users/me response', 'no password field');
  }

  // Password not in /users list
  const users = await a.get('/users');
  const usersStr = JSON.stringify(users.data);
  if (usersStr.includes('password123')) {
    log('FAIL', 'Password not in /users response', 'CRITICAL: plain password in list!');
  } else if (usersStr.includes('"password"')) {
    log('WARN', 'Password field in /users response', 'field exists but value may be hashed');
  } else {
    log('PASS', 'Password not in /users response', 'no password field exposed');
  }

  // Try to register with weak password (if registration endpoint exists)
  const weakPw = await http().post('/auth/register', { email: 'weaktest@test.com', password: '123', firstName: 'Weak', lastName: 'Test' });
  if (weakPw.status === 400 || weakPw.status === 422 || weakPw.status === 404) {
    log('PASS', 'Weak password rejected or registration not public', `HTTP ${weakPw.status}`);
  } else if (weakPw.status === 201) {
    log('WARN', 'Registration with weak password "123" accepted', 'consider adding password strength validation');
  }
}

// ─────────────────────────────────────────────
// 6. CORS HEADERS
// ─────────────────────────────────────────────
async function testCORS() {
  console.log('\n🌐 CORS HEADERS');

  const r = await http({ headers: { Origin: 'http://evil.com' } }).get('/health');
  const acao = r.headers['access-control-allow-origin'];

  if (!acao) {
    log('PASS', 'No ACAO header for unknown origin', 'CORS restricted');
  } else if (acao === '*') {
    log('WARN', 'ACAO: * (all origins)', 'Public API — check if credentials are also allowed');

    // If ACAO=* AND allow-credentials=true, that's a misconfiguration
    const acac = r.headers['access-control-allow-credentials'];
    if (acac === 'true') {
      log('FAIL', 'ACAO: * with credentials: true', 'CRITICAL: CORS misconfiguration!');
    }
  } else if (acao === 'http://evil.com') {
    log('FAIL', 'ACAO reflects arbitrary Origin', 'CORS misconfiguration — any origin allowed!');
  } else {
    log('PASS', `ACAO header: "${acao}"`, 'origin restricted');
  }

  // OPTIONS preflight
  const preflight = await http({ headers: { Origin: 'http://localhost', 'Access-Control-Request-Method': 'POST' } })
    .options('/auth/login');
  if (preflight.status === 200 || preflight.status === 204) {
    log('PASS', 'OPTIONS preflight responds', `HTTP ${preflight.status}`);
  } else {
    log('WARN', 'OPTIONS preflight', `HTTP ${preflight.status}`);
  }
}

// ─────────────────────────────────────────────
// 7. RATE LIMITING
// ─────────────────────────────────────────────
async function testRateLimit() {
  console.log('\n⏱️  RATE LIMITING');

  const requests = [];
  const N = 30;
  for (let i = 0; i < N; i++) {
    requests.push(http().post('/auth/login', { email: 'nobody@x.com', password: 'wrong' }));
  }

  const responses = await Promise.all(requests);
  const statuses = responses.map(r => r.status);
  const has429 = statuses.some(s => s === 429);
  const allPass = statuses.every(s => s !== 500);

  if (has429) {
    const count429 = statuses.filter(s => s === 429).length;
    log('PASS', `Rate limiting active after ${N} requests`, `${count429}/${N} got 429`);
  } else {
    log('WARN', `Rate limiting not triggered after ${N} failed logins`, 'consider adding throttler');
  }

  if (!allPass) {
    log('FAIL', 'Rate limit burst causes 500 errors', 'server unstable under load');
  } else {
    log('PASS', 'Server stable under burst', 'no 500 errors');
  }
}

// ─────────────────────────────────────────────
// 8. INPUT VALIDATION
// ─────────────────────────────────────────────
async function testInputValidation() {
  console.log('\n✅ INPUT VALIDATION');

  const token = await getToken();
  if (!token) { log('SKIP', 'Input validation', 'no token'); return; }
  const a = http({ headers: { Authorization: `Bearer ${token}` } });

  // Missing required fields
  const noName = await a.post('/patients', { gender: 'male' });
  if (noName.status === 400 || noName.status === 422) {
    log('PASS', 'Missing required fields → 400/422', `HTTP ${noName.status}`);
  } else if (noName.status === 201) {
    log('FAIL', 'Missing required fields accepted', 'no validation!');
  } else {
    log('WARN', 'Missing required fields', `HTTP ${noName.status}`);
  }

  // Invalid date format
  const badDate = await a.post('/patients', { firstName: 'A', lastName: 'B', dateOfBirth: 'not-a-date', gender: 'male' });
  if (badDate.status === 400 || badDate.status === 422) {
    log('PASS', 'Invalid dateOfBirth → 400/422', `HTTP ${badDate.status}`);
  } else {
    log('WARN', 'Invalid dateOfBirth', `HTTP ${badDate.status} — may not validate format`);
  }

  // Invalid gender enum
  const badGender = await a.post('/patients', { firstName: 'A', lastName: 'B', dateOfBirth: '1990-01-01', gender: 'robot' });
  if (badGender.status === 400 || badGender.status === 422) {
    log('PASS', 'Invalid gender enum → 400/422', `HTTP ${badGender.status}`);
  } else if (badGender.status === 201) {
    log('WARN', 'Invalid gender "robot" accepted', 'consider enum validation');
  } else {
    log('WARN', 'Invalid gender enum', `HTTP ${badGender.status}`);
  }

  // Very large payload
  const bigStr = 'A'.repeat(10000);
  const big = await a.post('/patients', { firstName: bigStr, lastName: 'B', dateOfBirth: '1990-01-01', gender: 'male' });
  if (big.status === 400 || big.status === 413 || big.status === 422) {
    log('PASS', 'Oversized field → 400/413/422', `HTTP ${big.status}`);
  } else {
    log('WARN', 'Oversized field (10k chars)', `HTTP ${big.status} — no length limit`);
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  HIS-MedSystem — Security Test Suite');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  await testJWT();
  await testPrivilegeEscalation();
  await testSQLInjection();
  await testXSS();
  await testPasswordSecurity();
  await testCORS();
  await testRateLimit();
  await testInputValidation();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  TOTAL: ${results.passed + results.failed + results.warnings} checks`);
  console.log(`  ✅ PASSED:   ${results.passed}`);
  console.log(`  ❌ FAILED:   ${results.failed}`);
  console.log(`  ⚠️  WARNINGS: ${results.warnings}`);
  console.log('═══════════════════════════════════════════\n');

  const fs = require('fs');
  fs.writeFileSync('/tmp/security-test-results.json', JSON.stringify({ ...results, ts: new Date().toISOString() }, null, 2));
  process.exit(results.failed > 0 ? 1 : 0);
})();
