const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API = 'http://localhost:3000/api';

const REPORT = {
  startTime: new Date().toISOString(),
  results: {},
  totalTests: 0,
  passed: 0,
  failed: 0,
};

const ROLES = {
  admin:     { email: 'admin@med.com',       password: 'password123' },
  doctor:    { email: 'doctor@med.com',      password: 'password123' },
  reception: { email: 'reception@med.com',   password: 'password123' },
  radiolog:  { email: 'radiolog@med.com',    password: 'password123' },
  lab:       { email: 'lab@med.com',         password: 'password123' },
};

async function login(role) {
  try {
    const r = await axios.post(`${API}/auth/login`, ROLES[role]);
    return r.data?.data?.accessToken;
  } catch {
    return null;
  }
}

async function apiCall(token, method, urlPath, data) {
  try {
    const config = {
      method,
      url: `${API}${urlPath}`,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (data) config.data = data;
    const r = await axios(config);
    return { status: r.status, data: r.data };
  } catch (e) {
    return { status: e.response?.status || 0, error: e.message };
  }
}

function test(role, name, condition, details) {
  REPORT.totalTests++;
  if (!REPORT.results[role]) REPORT.results[role] = { tests: [] };
  if (condition) {
    REPORT.passed++;
    REPORT.results[role].tests.push({ name, status: 'PASS' });
    console.log(`    ✅ ${name}`);
  } else {
    REPORT.failed++;
    REPORT.results[role].tests.push({ name, status: 'FAIL', details });
    console.log(`    ❌ ${name} → ${details}`);
  }
}

const ALLOWED = {
  admin: [
    '/health',
    '/patients',
    '/appointments',
    '/rooms',
    '/users',
    '/studies',
    '/lab/tests',
    '/lab/orders',
    '/reports/stats',
    '/tutorials/list',
    '/tutorials/progress',
  ],
  doctor: [
    '/health',
    '/patients',
    '/appointments',
    '/tutorials/list',
    '/tutorials/progress',
  ],
  reception: [
    '/health',
    '/patients',
    '/appointments',
    '/tutorials/list',
    '/tutorials/progress',
  ],
  radiolog: [
    '/health',
    '/studies',
    '/tutorials/list',
    '/tutorials/progress',
  ],
  lab: [
    '/health',
    '/lab/orders',
    '/lab/tests',
    '/tutorials/list',
    '/tutorials/progress',
  ],
};

// Note: GET /rooms and GET /lab/orders are intentionally open to all authenticated users
// (receptionists need rooms, doctors need lab orders). Only admin can modify them.
const FORBIDDEN = {
  doctor:    ['/users'],
  reception: ['/users'],
  radiolog:  ['/users'],
  lab:       ['/users'],
};

async function smokeTestRole(role) {
  console.log(`\n═══ ${role.toUpperCase()} ═══`);

  const token = await login(role);
  if (!REPORT.results[role]) REPORT.results[role] = { tests: [] };
  REPORT.results[role].token = token ? 'ok' : 'FAIL';

  test(role, 'Login', !!token, 'Login failed');
  if (!token) return;

  for (const ep of ALLOWED[role] || []) {
    const res = await apiCall(token, 'GET', ep);
    test(role, `GET ${ep}`, res.status === 200, `Got ${res.status}`);
  }

  for (const ep of FORBIDDEN[role] || []) {
    const res = await apiCall(token, 'GET', ep);
    test(role, `Forbidden: ${ep}`, [401, 403].includes(res.status), `Got ${res.status} (expected 401/403)`);
  }

  // Tutorial mark-complete test for each role
  const completeRes = await apiCall(token, 'POST', '/tutorials/complete/system-overview', {});
  test(role, 'POST /tutorials/complete/system-overview', completeRes.status === 201, `Got ${completeRes.status}`);
}

function generateMarkdown() {
  let md = `# 🧪 Smoke Test Report\n\n`;
  md += `**Запуск:** ${REPORT.startTime}\n`;
  md += `**Завершён:** ${REPORT.endTime}\n\n`;
  md += `## 📊 Сводка\n\n`;
  md += `| Метрика | Значение |\n|---------|----------|\n`;
  md += `| Всего тестов | ${REPORT.totalTests} |\n`;
  md += `| ✅ Прошло | ${REPORT.passed} |\n`;
  md += `| ❌ Провалилось | ${REPORT.failed} |\n`;
  md += `| Pass rate | ${REPORT.totalTests > 0 ? Math.round(REPORT.passed / REPORT.totalTests * 100) : 0}% |\n\n`;

  for (const role of Object.keys(REPORT.results)) {
    const r = REPORT.results[role];
    const passed = (r.tests || []).filter(t => t.status === 'PASS').length;
    const total = (r.tests || []).length;
    md += `## ${role.toUpperCase()} (${passed}/${total})\n\n`;
    md += `| Test | Status |\n|------|--------|\n`;
    for (const t of r.tests || []) {
      const icon = t.status === 'PASS' ? '✅' : '❌';
      const detail = t.details ? ` — ${t.details}` : '';
      md += `| ${t.name} | ${icon}${detail} |\n`;
    }
    md += `\n`;
  }
  return md;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 SMOKE TEST — All 5 Roles');
  console.log('═══════════════════════════════════════════');

  for (const role of Object.keys(ROLES)) {
    await smokeTestRole(role);
  }

  REPORT.endTime = new Date().toISOString();

  const mdContent = generateMarkdown();
  const reportPath = path.join(__dirname, '../../SMOKE_TEST_REPORT.md');
  const jsonPath = path.join(__dirname, 'results.json');

  fs.writeFileSync(reportPath, mdContent);
  fs.writeFileSync(jsonPath, JSON.stringify(REPORT, null, 2));

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 Total: ${REPORT.passed}/${REPORT.totalTests} passed (${Math.round(REPORT.passed/REPORT.totalTests*100)}%)`);
  console.log(`📝 Report: SMOKE_TEST_REPORT.md`);
  console.log('═══════════════════════════════════════════');

  if (REPORT.failed > 0) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
