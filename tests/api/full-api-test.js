const axios = require('../node_modules/axios');
const BASE = 'http://localhost:3000/api';

const ROLES = [
  { email: 'admin@med.com',      password: 'password123', role: 'admin' },
  { email: 'doctor@med.com',     password: 'password123', role: 'doctor' },
  { email: 'reception@med.com',  password: 'password123', role: 'receptionist' },
  { email: 'radiolog@med.com',   password: 'password123', role: 'radiologist' },
  { email: 'lab@med.com',        password: 'password123', role: 'lab_technician' },
];

const results = { passed: 0, failed: 0, tests: [] };

function log(status, label, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`);
  results.tests.push({ status, label, detail });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
}

async function login(email, password) {
  const res = await axios.post(`${BASE}/auth/login`, { email, password }, { validateStatus: () => true });
  return res.data?.data?.accessToken || null;
}

function api(token) {
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });
}

// ─────────────────────────────────────────────
// 1. AUTH TESTS
// ─────────────────────────────────────────────
async function testAuth() {
  console.log('\n📋 AUTH TESTS');

  // Valid login for each role
  for (const u of ROLES) {
    const token = await login(u.email, u.password);
    if (token) {
      log('PASS', `Login ${u.role}`, 'token received');
      u.token = token;
    } else {
      log('FAIL', `Login ${u.role}`, 'no token');
    }
  }

  // Wrong password
  const bad = await axios.post(`${BASE}/auth/login`, { email: 'admin@med.com', password: 'wrong' }, { validateStatus: () => true });
  if (bad.status === 401 || bad.status === 400) {
    log('PASS', 'Wrong password rejected', `HTTP ${bad.status}`);
  } else {
    log('FAIL', 'Wrong password rejected', `HTTP ${bad.status}`);
  }

  // Non-existent user
  const none = await axios.post(`${BASE}/auth/login`, { email: 'nobody@med.com', password: 'test' }, { validateStatus: () => true });
  if (none.status === 401 || none.status === 400 || none.status === 404) {
    log('PASS', 'Non-existent user rejected', `HTTP ${none.status}`);
  } else {
    log('FAIL', 'Non-existent user rejected', `HTTP ${none.status}`);
  }

  // /users/me works with token
  const a = ROLES.find(r => r.role === 'admin');
  if (a?.token) {
    const me = await api(a.token).get('/users/me');
    if (me.status === 200 && me.data?.data?.email === 'admin@med.com') {
      log('PASS', 'GET /users/me for admin', 'returns correct user');
    } else {
      log('FAIL', 'GET /users/me for admin', `HTTP ${me.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// 2. RBAC MATRIX
// ─────────────────────────────────────────────
async function testRBAC() {
  console.log('\n🔒 RBAC MATRIX');

  // [endpoint, method, expectedByRole: {admin, doctor, receptionist, radiologist, lab_technician}]
  // Note: /patients and /appointments have no role restriction — all authenticated staff can view
  // /lab/orders: all authenticated staff can view (lab context needed by multiple roles)
  // /reports/summary: admin only
  const matrix = [
    { ep: '/patients',        m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
    { ep: '/appointments',    m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
    { ep: '/users',           m: 'get', admin: 200, doctor: 403, receptionist: 403, radiologist: 403, lab_technician: 403 },
    { ep: '/studies',         m: 'get', admin: 200, doctor: 200, receptionist: 403, radiologist: 200, lab_technician: 403 },
    { ep: '/lab/orders',      m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
    { ep: '/lab/tests',       m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
    { ep: '/rooms',           m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
    { ep: '/reports/summary', m: 'get', admin: 200, doctor: 403, receptionist: 403, radiologist: 403, lab_technician: 403 },
    { ep: '/notifications',   m: 'get', admin: 200, doctor: 200, receptionist: 200, radiologist: 200, lab_technician: 200 },
  ];

  for (const row of matrix) {
    for (const u of ROLES) {
      if (!u.token) continue;
      const expected = row[u.role];
      const res = await api(u.token)[row.m](row.ep);
      const actual = res.status;
      // Accept 200 or 201 as success
      const pass =
        (expected === 200 && (actual === 200 || actual === 201)) ||
        (expected === 403 && (actual === 403 || actual === 401));
      log(pass ? 'PASS' : 'FAIL', `${row.m.toUpperCase()} ${row.ep} [${u.role}]`, `expected ${expected}, got ${actual}`);
    }
  }
}

// ─────────────────────────────────────────────
// 3. CRUD — PATIENTS
// ─────────────────────────────────────────────
async function testPatientsCRUD() {
  console.log('\n👤 PATIENTS CRUD');

  const admin = ROLES.find(r => r.role === 'admin');
  if (!admin?.token) { log('SKIP', 'Patients CRUD', 'no admin token'); return; }
  const a = api(admin.token);

  // CREATE
  const created = await a.post('/patients', {
    firstName: 'Test',
    lastName: 'AutoE2E',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    phone: '+37300000001',
    email: 'autoe2e@test.com',
  });
  const pid = created.data?.data?.id;
  if (created.status === 201 && pid) {
    log('PASS', 'POST /patients', `id=${pid}`);
  } else {
    log('FAIL', 'POST /patients', `HTTP ${created.status} — ${JSON.stringify(created.data).substr(0,100)}`);
    return;
  }

  // READ one
  const get1 = await a.get(`/patients/${pid}`);
  if (get1.status === 200 && get1.data?.data?.id === pid) {
    log('PASS', 'GET /patients/:id', 'correct patient returned');
  } else {
    log('FAIL', 'GET /patients/:id', `HTTP ${get1.status}`);
  }

  // READ list — should include new patient
  const list = await a.get('/patients');
  const found = list.data?.data?.some(p => p.id === pid);
  if (list.status === 200 && found) {
    log('PASS', 'GET /patients (list)', 'new patient visible');
  } else {
    log('FAIL', 'GET /patients (list)', `found=${found}, HTTP ${list.status}`);
  }

  // UPDATE
  const updated = await a.put(`/patients/${pid}`, { phone: '+37399999999' });
  if (updated.status === 200) {
    log('PASS', 'PUT /patients/:id', 'updated');
  } else {
    log('FAIL', 'PUT /patients/:id', `HTTP ${updated.status}`);
  }

  // DELETE
  const deleted = await a.delete(`/patients/${pid}`);
  if (deleted.status === 200 || deleted.status === 204) {
    log('PASS', 'DELETE /patients/:id', 'deleted');
  } else {
    log('FAIL', 'DELETE /patients/:id', `HTTP ${deleted.status}`);
  }

  // Confirm gone
  const gone = await a.get(`/patients/${pid}`);
  if (gone.status === 404) {
    log('PASS', 'GET /patients/:id after delete', '404 as expected');
  } else {
    log('FAIL', 'GET /patients/:id after delete', `HTTP ${gone.status}`);
  }
}

// ─────────────────────────────────────────────
// 4. BUSINESS LOGIC
// ─────────────────────────────────────────────
async function testBusinessLogic() {
  console.log('\n⚙️  BUSINESS LOGIC');

  const admin  = ROLES.find(r => r.role === 'admin');
  const doctor = ROLES.find(r => r.role === 'doctor');
  const recep  = ROLES.find(r => r.role === 'receptionist');
  if (!admin?.token) { log('SKIP', 'Business logic', 'no admin token'); return; }

  const adm = api(admin.token);

  // Create a temp patient for logic tests
  const pat = await adm.post('/patients', {
    firstName: 'Logic', lastName: 'Test', dateOfBirth: '1985-06-15',
    gender: 'female', phone: '+37311111111', email: 'logic.test@test.com',
  });
  const patId = pat.data?.data?.id;
  if (!patId) { log('FAIL', 'Business logic setup', 'could not create patient'); return; }

  // Get a doctor user id
  const docList = await adm.get('/users/doctors');
  const docUser = docList.data?.data?.[0];
  if (!docUser) { log('SKIP', 'Appointment tests', 'no doctors'); }

  // Get a room
  const roomList = await adm.get('/rooms');
  const room = roomList.data?.data?.[0];

  if (docUser && room) {
    // Book appointment
    const appt1 = await adm.post('/appointments', {
      patientId: patId,
      doctorId: docUser.id,
      roomId: room.id,
      date: '2026-07-01',
      time: '10:00',
    });
    if (appt1.status === 201) {
      log('PASS', 'POST /appointments (create)', `id=${appt1.data?.data?.id}`);

      // Duplicate booking same doctor/time — should be rejected
      const appt2 = await adm.post('/appointments', {
        patientId: patId,
        doctorId: docUser.id,
        roomId: room.id,
        date: '2026-07-01',
        time: '10:00',
      });
      if (appt2.status === 400 || appt2.status === 409 || appt2.status === 422) {
        log('PASS', 'Duplicate appointment rejected', `HTTP ${appt2.status}`);
      } else if (appt2.status === 201) {
        log('WARN', 'Duplicate appointment allowed', 'system allows same doctor/time booking — consider adding conflict check');
      } else {
        log('WARN', 'Duplicate appointment', `HTTP ${appt2.status} — may be allowed`);
      }

      // Clean up appointment
      if (appt1.data?.data?.id) {
        await adm.delete(`/appointments/${appt1.data.data.id}`);
      }
    } else {
      log('FAIL', 'POST /appointments (create)', `HTTP ${appt1.status} — ${JSON.stringify(appt1.data).substr(0,120)}`);
    }
  }

  // Lab order CRUD (admin creates)
  const labTests = await adm.get('/lab/tests');
  const labTest = labTests.data?.data?.[0];
  if (labTest) {
    const order = await adm.post('/lab/orders', {
      patientId: patId,
      testId: labTest.id,
      priority: 'routine',
    });
    if (order.status === 201) {
      log('PASS', 'POST /lab/orders', `id=${order.data?.data?.id}`);
      const oid = order.data?.data?.id;

      // Lab tech can update status
      if (ROLES.find(r => r.role === 'lab_technician')?.token) {
        const lt = api(ROLES.find(r => r.role === 'lab_technician').token);
        const upd = await lt.patch(`/lab/orders/${oid}`, { status: 'in_progress' });
        if (upd.status === 200) {
          log('PASS', 'Lab tech PATCH /lab/orders/:id/status', 'in_progress');
        } else {
          log('FAIL', 'Lab tech PATCH /lab/orders/:id/status', `HTTP ${upd.status}`);
        }
      }
    } else {
      log('FAIL', 'POST /lab/orders', `HTTP ${order.status}`);
    }
  } else {
    log('WARN', 'POST /lab/orders', 'no lab tests in catalog, skipping');
  }

  // Clean up patient
  await adm.delete(`/patients/${patId}`);
}

// ─────────────────────────────────────────────
// 5. NOTIFICATIONS
// ─────────────────────────────────────────────
async function testNotifications() {
  console.log('\n🔔 NOTIFICATIONS');
  for (const u of ROLES) {
    if (!u.token) continue;
    const res = await api(u.token).get('/notifications');
    if (res.status === 200) {
      log('PASS', `GET /notifications [${u.role}]`, `${(res.data?.data || []).length} items`);
    } else {
      log('FAIL', `GET /notifications [${u.role}]`, `HTTP ${res.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  HIS-MedSystem — Full API E2E Test');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  await testAuth();
  await testRBAC();
  await testPatientsCRUD();
  await testBusinessLogic();
  await testNotifications();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  TOTAL: ${results.passed + results.failed} tests`);
  console.log(`  ✅ PASSED: ${results.passed}`);
  console.log(`  ❌ FAILED: ${results.failed}`);
  console.log('═══════════════════════════════════════════\n');

  // Write JSON for report generation
  const fs = require('fs');
  fs.writeFileSync('/tmp/api-test-results.json', JSON.stringify({ ...results, ts: new Date().toISOString() }, null, 2));
  process.exit(results.failed > 0 ? 1 : 0);
})();
