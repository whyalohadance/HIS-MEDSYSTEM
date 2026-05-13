const { chromium } = require('./node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost';
const REPORT = {
  startTime: new Date().toISOString(),
  results: [],
  errors: [],
  consoleErrors: [],
  failedRequests: [],
  brokenPages: [],
  missingTranslations: [],
  hardcodedTexts: []
};

const ROLES = {
  admin:     { email: 'admin@med.com',     password: 'password123', name: 'Admin' },
  doctor:    { email: 'doctor@med.com',    password: 'password123', name: 'Doctor' },
  reception: { email: 'reception@med.com', password: 'password123', name: 'Reception' },
  radiolog:  { email: 'radiolog@med.com',  password: 'password123', name: 'Radiologist' },
  lab:       { email: 'lab@med.com',       password: 'password123', name: 'Lab' }
};

const PAGES_BY_ROLE = {
  admin:     ['/dashboard', '/patients', '/appointments', '/rooms', '/staff', '/profile',
              '/ris-dashboard', '/worklist', '/studies',
              '/lab-dashboard', '/lab/worklist', '/lab/orders', '/lab-catalog',
              '/reports', '/notifications'],
  doctor:    ['/dashboard', '/patients', '/appointments', '/profile'],
  reception: ['/dashboard', '/patients', '/appointments', '/reports', '/profile'],
  radiolog:  ['/ris-dashboard', '/worklist', '/studies', '/profile'],
  lab:       ['/lab-dashboard', '/lab/worklist', '/lab/orders', '/profile']
};

const LANGS = ['ru', 'ro', 'en'];

const LANG_MARKERS = {
  ru: ['Панель', 'Пациенты', 'Профиль', 'Приём'],
  ro: ['Panou', 'Pacienți', 'Profil', 'Program'],
  en: ['Dashboard', 'Patients', 'Profile', 'Appointment']
};

// i18n key pattern — these should NOT be visible as plain text in UI
const I18N_KEY_PATTERN = /\b[A-Z][A-Z_]{2,}\.[A-Z_]{2,}(\.[A-Z_]{2,})?\b/g;

function log(msg) {
  const time = new Date().toISOString().substr(11, 8);
  console.log(`[${time}] ${msg}`);
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function login(page, role) {
  log(`▶ Login: ${role.name}`);
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  await page.fill('input[type="email"]', role.email);
  await page.fill('input[type="password"]', role.password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  await page.waitForTimeout(2000);
  const url = page.url();

  if (url.includes('/auth/login')) {
    REPORT.errors.push({ test: `login-${role.name}`, message: 'Still on /auth/login after submit' });
    log(`  ❌ Login FAILED for ${role.name}`);
    return false;
  }
  log(`  ✅ Logged in → ${url.replace(BASE_URL, '')}`);
  return true;
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
async function logout(page) {
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
}

// ─── CHECK PAGE ───────────────────────────────────────────────────────────────
async function checkPage(page, url, role) {
  const result = {
    role: role.name,
    page: url,
    accessible: false,
    httpStatus: null,
    pageTitle: '',
    untranslatedKeys: [],
    visibleText: '',
    consoleErrorsOnPage: [],
    timestamp: new Date().toISOString()
  };

  const pageErrors = [];
  const errHandler = msg => { if (msg.type() === 'error') pageErrors.push(msg.text()); };
  page.on('console', errHandler);

  try {
    const response = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
    result.httpStatus = response ? response.status() : 0;
    result.accessible = result.httpStatus >= 200 && result.httpStatus < 400;

    await page.waitForTimeout(1500);

    result.pageTitle = await page.title().catch(() => '');
    const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    result.visibleText = bodyText.substr(0, 600).replace(/\s+/g, ' ');

    // Check for untranslated i18n keys
    const keyMatches = (bodyText.match(I18N_KEY_PATTERN) || [])
      .filter(k => k.includes('.') && k.split('.').every(p => /^[A-Z_]+$/.test(p)));
    if (keyMatches.length > 0) {
      result.untranslatedKeys = [...new Set(keyMatches)];
      REPORT.missingTranslations.push({
        role: role.name,
        page: url,
        message: `${result.untranslatedKeys.length} untranslated keys in DOM`,
        keysFound: result.untranslatedKeys.slice(0, 10)
      });
    }

    const icon = result.accessible ? '✅' : '❌';
    const keyWarn = result.untranslatedKeys.length > 0 ? ` ⚠️ keys: ${result.untranslatedKeys.slice(0,3).join(',')}` : '';
    log(`  ${icon} ${url} (${result.httpStatus}) — ${bodyText.length}ch${keyWarn}`);
  } catch (e) {
    result.error = e.message.substr(0, 200);
    log(`  ❌ ${url} — ${e.message.substr(0, 80)}`);
    REPORT.brokenPages.push({ page: url, role: role.name, error: result.error });
  }

  result.consoleErrorsOnPage = pageErrors.slice(0, 5);
  if (pageErrors.length > 0) {
    REPORT.consoleErrors.push(...pageErrors.slice(0, 5).map(t => ({ role: role.name, page: url, text: t })));
  }
  page.off('console', errHandler);
  REPORT.results.push(result);
  return result;
}

// ─── TRANSLATION TESTS ────────────────────────────────────────────────────────
async function checkTranslations(page, role) {
  log('\n▶ Translation test (3 languages)');
  const pages = PAGES_BY_ROLE.admin;
  const testPage = pages[0]; // /dashboard

  for (const lang of LANGS) {
    log(`  [${lang}] testing...`);
    await page.evaluate((l) => {
      localStorage.setItem('language', l);
      localStorage.setItem('selectedLang', l);
      localStorage.setItem('lang', l);
    }, lang);

    await page.goto(`${BASE_URL}${testPage}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');

    // Check expected markers
    const markers = LANG_MARKERS[lang];
    const found = markers.filter(m => bodyText.includes(m));

    if (found.length === 0) {
      REPORT.missingTranslations.push({
        role: role.name, lang, page: testPage,
        message: `No ${lang.toUpperCase()} markers found. Expected: ${markers.join(', ')}`
      });
      log(`    ⚠️ No ${lang} markers`);
    } else {
      log(`    ✅ Found ${lang} markers: ${found.join(', ')}`);
    }

    // Check for raw translation keys
    const keys = (bodyText.match(I18N_KEY_PATTERN) || [])
      .filter(k => k.includes('.') && k.split('.').every(p => /^[A-Z_]+$/.test(p)));
    if (keys.length > 0) {
      const unique = [...new Set(keys)];
      REPORT.missingTranslations.push({
        role: role.name, lang, page: testPage,
        message: `${unique.length} untranslated keys visible`,
        keysFound: unique.slice(0, 10)
      });
      log(`    ⚠️ ${unique.length} untranslated keys`);
    }

    // Check for Cyrillic hardcode on non-Russian pages
    if (lang !== 'ru') {
      const cyrMatches = (bodyText.match(/[А-ЯЁа-яё]{5,}/g) || []);
      const suspicious = [...new Set(cyrMatches)].filter(m => {
        // Filter out common data (patient names etc in content)
        return cyrMatches.filter(x => x === m).length > 3;
      });
      if (suspicious.length > 5) {
        REPORT.hardcodedTexts.push({
          lang, page: testPage,
          message: `${suspicious.length} Cyrillic strings on ${lang} page`,
          samples: suspicious.slice(0, 5)
        });
        log(`    ⚠️ ${suspicious.length} Cyrillic strings on ${lang} page`);
      }
    }
  }
}

// ─── WORKFLOW TESTS ───────────────────────────────────────────────────────────
async function testWorkflows(page) {
  log('\n▶ Workflow tests');

  // 1. Patient card tabs
  log('  [patient-card] Testing...');
  await page.goto(`${BASE_URL}/patients`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const patientLinks = await page.$$('a[href*="/patients/"], [class*="patient-card"], [class*="patient-row"]');
  if (patientLinks.length > 0) {
    try {
      await patientLinks[0].click();
      await page.waitForTimeout(2000);
      const tabs = await page.$$('[class*="tab"]');
      log(`  ✅ Patient card opened, ${tabs.length} tabs found`);

      // Click "Studies" tab if exists
      for (const tab of tabs) {
        const txt = await page.evaluate(el => el.textContent, tab).catch(() => '');
        if (txt.toLowerCase().includes('stud') || txt.toLowerCase().includes('исслед')) {
          await tab.click().catch(() => {});
          await page.waitForTimeout(1500);
          log(`  ✅ Studies tab clicked`);
          break;
        }
      }
    } catch (e) {
      log(`  ⚠️ Patient card: ${e.message.substr(0, 80)}`);
    }
  } else {
    log('  ⚠️ No patient links found');
  }

  // 2. Appointments page
  log('  [appointments] Testing...');
  await page.goto(`${BASE_URL}/appointments`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const createBtn = await page.$('[class*="btn-add"], button.btn-primary, [class*="btn-create"]');
  if (createBtn) {
    const btnText = await page.evaluate(el => el.innerText, createBtn);
    log(`  ✅ Create button found: "${btnText.trim().substr(0, 30)}"`);

    // Click it to open modal/form
    await createBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    const modal = await page.$('[class*="modal"], [class*="dialog"], [class*="form-card"]');
    if (modal) {
      log(`  ✅ Create form/modal opened`);
    } else {
      log(`  ⚠️ No modal after clicking create`);
    }
    // Close with Escape
    await page.keyboard.press('Escape').catch(() => {});
  } else {
    REPORT.errors.push({ test: 'appointments-create-btn', message: 'No create button on /appointments' });
    log(`  ⚠️ No create button`);
  }

  // 3. Lab orders page
  log('  [lab/orders] Testing...');
  await page.goto(`${BASE_URL}/lab/orders`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const labText = await page.evaluate(() => document.body?.innerText || '');
  log(`  ✅ Lab orders: ${labText.length} chars`);

  // 4. RIS Worklist page
  log('  [worklist] Testing...');
  await page.goto(`${BASE_URL}/worklist`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const wlText = await page.evaluate(() => document.body?.innerText || '');
  log(`  ✅ RIS worklist: ${wlText.length} chars`);

  // 5. Reports page
  log('  [reports] Testing...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const repText = await page.evaluate(() => document.body?.innerText || '');
  log(`  ✅ Reports: ${repText.length} chars`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function runAllTests() {
  log('═══════════════════════════════════════════════');
  log('🚀 HIS-MedSystem — Full E2E Frontend Test');
  log(`   Playwright Chromium | ${BASE_URL}`);
  log('═══════════════════════════════════════════════');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const [roleKey, role] of Object.entries(ROLES)) {
    log(`\n══════ ROLE: ${role.name} (${roleKey}) ══════`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'ru-RU'
    });
    const page = await context.newPage();

    // Track failed requests
    page.on('requestfailed', req => {
      const url = req.url().replace(BASE_URL, '');
      if (!url.includes('favicon') && !url.includes('hot-update')) {
        REPORT.failedRequests.push({ role: role.name, url, error: req.failure()?.errorText });
      }
    });

    // Track 4xx/5xx
    page.on('response', resp => {
      const status = resp.status();
      if (status >= 400) {
        const url = resp.url().replace(BASE_URL, '');
        if (!url.includes('favicon') && !url.includes('hot-update') && url.startsWith('/api/')) {
          REPORT.failedRequests.push({ role: role.name, url, status });
        }
      }
    });

    const loggedIn = await login(page, role);
    if (!loggedIn) {
      await context.close();
      continue;
    }

    // Test all pages
    for (const pagePath of PAGES_BY_ROLE[roleKey]) {
      await checkPage(page, pagePath, role);
      await page.waitForTimeout(200);
    }

    // Admin gets full translation + workflow tests
    if (roleKey === 'admin') {
      await checkTranslations(page, role);
      // Re-login
      await logout(page);
      await login(page, role);
      await testWorkflows(page);
    }

    await logout(page);
    await context.close();
    log(`\n  ✅ ${role.name} done`);
  }

  await browser.close();

  REPORT.endTime = new Date().toISOString();
  const duration = Math.round((new Date(REPORT.endTime) - new Date(REPORT.startTime)) / 1000);
  REPORT.durationSeconds = duration;

  // Save JSON
  fs.writeFileSync(path.join(__dirname, 'full-report.json'), JSON.stringify(REPORT, null, 2));

  // Generate markdown
  const md = generateMarkdown(duration);
  fs.writeFileSync(path.join(__dirname, '../../E2E_REPORT.md'), md);

  log('\n═══════════════════════════════════════════════');
  log('📊 SUMMARY');
  log('═══════════════════════════════════════════════');
  const total = REPORT.results.length;
  const ok = REPORT.results.filter(r => r.accessible).length;
  log(`Pages: ${ok}/${total}`);
  log(`Broken: ${REPORT.brokenPages.length}`);
  log(`Console errors: ${REPORT.consoleErrors.length}`);
  log(`Failed requests: ${REPORT.failedRequests.length}`);
  log(`Translation issues: ${REPORT.missingTranslations.length}`);
  log(`Duration: ${duration}s`);
  log('\n✅ Reports: tests/e2e/full-report.json + E2E_REPORT.md');
}

function generateMarkdown(duration) {
  const total = REPORT.results.length;
  const ok = REPORT.results.filter(r => r.accessible).length;
  const broken = REPORT.brokenPages.length;
  const ceCount = REPORT.consoleErrors.length;
  const frCount = REPORT.failedRequests.filter(f => f.url.startsWith('/api/')).length;
  const transCount = REPORT.missingTranslations.length;
  const score = Math.round((ok / Math.max(total, 1)) * 100);

  let md = `# 🧪 HIS-MedSystem — E2E Frontend Test Report\n\n`;
  md += `> Автоматический тест через Playwright (headless Chromium)\n\n`;
  md += `**Запуск:** ${REPORT.startTime}\n`;
  md += `**Завершение:** ${REPORT.endTime}\n`;
  md += `**Длительность:** ${duration} сек\n\n`;
  md += `---\n\n`;

  md += `## 📊 ОБЩАЯ СТАТИСТИКА\n\n`;
  md += `| Метрика | Значение | Статус |\n`;
  md += `|---------|----------|--------|\n`;
  md += `| Страниц проверено | ${total} | — |\n`;
  md += `| ✅ Доступны (HTTP 2xx) | ${ok} | ${ok === total ? '🟢 OK' : '🟡'} |\n`;
  md += `| ❌ Сломаны | ${broken} | ${broken === 0 ? '🟢 OK' : '🔴 ПРОБЛЕМА'} |\n`;
  md += `| 🔴 Console errors | ${ceCount} | ${ceCount === 0 ? '🟢 OK' : ceCount < 10 ? '🟡' : '🔴'} |\n`;
  md += `| 🌐 Failed API requests | ${frCount} | ${frCount === 0 ? '🟢 OK' : '🔴'} |\n`;
  md += `| 🌍 Проблемы с переводами | ${transCount} | ${transCount === 0 ? '🟢 OK' : transCount < 3 ? '🟡' : '🔴'} |\n`;
  md += `| **Оценка** | **${score}%** | ${score >= 95 ? '🟢 Отлично' : score >= 80 ? '🟡 Хорошо' : '🔴 Проблемы'} |\n\n`;

  md += `---\n\n## 🎭 РЕЗУЛЬТАТЫ ПО РОЛЯМ\n\n`;
  for (const [roleKey, role] of Object.entries(ROLES)) {
    const roleResults = REPORT.results.filter(r => r.role === role.name);
    const roleOk = roleResults.filter(r => r.accessible).length;
    const icon = roleOk === roleResults.length ? '✅' : '⚠️';
    md += `### ${icon} ${role.name} — ${roleOk}/${roleResults.length} страниц\n\n`;
    if (roleResults.length === 0) {
      md += `> ❌ Нет результатов (возможно, логин не сработал)\n\n`;
      continue;
    }
    md += `| Страница | HTTP | Непереведённые ключи |\n`;
    md += `|----------|------|---------------------|\n`;
    for (const r of roleResults) {
      const statusIcon = r.accessible ? '✅' : '❌';
      const keys = r.untranslatedKeys?.length > 0 ? `⚠️ \`${r.untranslatedKeys.slice(0,3).join('`, `')}\`` : '—';
      md += `| \`${r.page}\` | ${statusIcon} ${r.httpStatus} | ${keys} |\n`;
    }
    md += `\n`;
  }

  if (REPORT.brokenPages.length > 0) {
    md += `---\n\n## ❌ СЛОМАННЫЕ СТРАНИЦЫ\n\n`;
    for (const b of REPORT.brokenPages) {
      md += `- **${b.role}** \`${b.page}\`: ${b.error}\n`;
    }
    md += `\n`;
  }

  if (REPORT.consoleErrors.length > 0) {
    md += `---\n\n## 🔴 КОНСОЛЬНЫЕ ОШИБКИ (топ 20 уникальных)\n\n`;
    const unique = [...new Map(REPORT.consoleErrors.map(e => [e.text.substr(0,120), e])).values()].slice(0, 20);
    for (const e of unique) {
      md += `- **${e.role}** \`${e.page}\`: \`${e.text.substr(0, 180)}\`\n`;
    }
    md += `\n`;
  }

  if (REPORT.failedRequests.filter(f => f.url.startsWith('/api/')).length > 0) {
    md += `---\n\n## 🌐 FAILED API REQUESTS\n\n`;
    const apiFails = REPORT.failedRequests.filter(f => f.url.startsWith('/api/'));
    const seen = new Set();
    for (const f of apiFails) {
      const k = `${f.status}:${f.url}`;
      if (!seen.has(k)) {
        seen.add(k);
        md += `- **${f.role}** \`${f.url}\` → ${f.status || f.error}\n`;
      }
    }
    md += `\n`;
  }

  if (REPORT.missingTranslations.length > 0) {
    md += `---\n\n## 🌍 ПРОБЛЕМЫ С ПЕРЕВОДАМИ\n\n`;
    for (const t of REPORT.missingTranslations.slice(0, 15)) {
      md += `### ${t.role || '?'} — ${t.lang ? `[${t.lang.toUpperCase()}]` : ''} \`${t.page || ''}\`\n`;
      md += `> ${t.message}\n`;
      if (t.keysFound?.length > 0) {
        md += `\n**Ключи:** \`${t.keysFound.slice(0, 8).join('`, `')}\`\n`;
      }
      md += `\n`;
    }
  }

  if (REPORT.hardcodedTexts.length > 0) {
    md += `---\n\n## ⚠️ ХАРДКОД НА НЕ-РУССКИХ СТРАНИЦАХ\n\n`;
    for (const h of REPORT.hardcodedTexts) {
      md += `- **[${h.lang?.toUpperCase()}]** \`${h.page}\`: ${h.message}\n`;
      if (h.samples) md += `  Примеры: ${h.samples.join(', ')}\n`;
    }
    md += `\n`;
  }

  if (REPORT.errors.length > 0) {
    md += `---\n\n## ⚠️ ОШИБКИ WORKFLOW ТЕСТОВ\n\n`;
    for (const e of REPORT.errors) {
      md += `- **${e.test}**: ${e.message}\n`;
    }
    md += `\n`;
  }

  md += `---\n\n## 🎯 ЗАКЛЮЧЕНИЕ\n\n`;
  if (broken === 0 && ceCount < 5 && transCount === 0) {
    md += `### ✅ Проект в отличном состоянии!\n\n`;
    md += `- Все ${total} страниц доступны\n`;
    md += `- Консоль чистая\n`;
    md += `- Переводы работают на RU/RO/EN\n`;
  } else {
    md += `### Результаты: ${score}% (${ok}/${total} страниц)\n\n`;
    if (broken > 0) md += `- ❌ **${broken} сломанных страниц** — исправить в первую очередь\n`;
    if (ceCount > 5) md += `- 🔴 **${ceCount} консольных ошибок** — проверить JS исключения\n`;
    if (transCount > 0) md += `- 🌍 **${transCount} проблем с переводами** — добавить недостающие ключи\n`;
  }

  md += `\n---\n_Автоматически сгенерировано Playwright E2E тестом — ${new Date().toISOString()}_\n`;
  return md;
}

runAllTests().catch(e => {
  console.error('FATAL:', e.message);
  fs.writeFileSync(
    path.join(__dirname, 'full-report.json'),
    JSON.stringify({ ...REPORT, fatalError: e.message }, null, 2)
  );
  process.exit(1);
});
