// Puppeteer's bundled Chromium crashes on macOS 26 (Tahoe) — use Playwright's Chromium instead
const { chromium: playwrightChromium } = require('./node_modules/playwright');
const CHROMIUM_PATH = playwrightChromium.executablePath();
const puppeteer = require('./node_modules/puppeteer');
const axios = require('../node_modules/axios');
const fs = require('fs');

const BASE = 'http://localhost';
const API  = 'http://localhost:3000/api';
const REPORT = {
  startTime: new Date().toISOString(),
  api: {},
  frontend: {},
  bundleSize: {},
  recommendations: []
};

async function getToken() {
  const r = await axios.post(`${API}/auth/login`, { email: 'admin@med.com', password: 'password123' });
  return r.data?.data?.accessToken;
}

// ─────────────────────────────────────────────
// 1. API RESPONSE TIMES
// ─────────────────────────────────────────────
async function testAPIPerformance(token) {
  console.log('\n══ API PERFORMANCE (5 samples per endpoint) ══');

  const endpoints = [
    '/patients',
    '/appointments',
    '/rooms',
    '/users',
    '/studies',
    '/lab/tests',
    '/lab/orders',
    '/notifications',
    '/reports/summary',
    '/health',
  ];

  for (const ep of endpoints) {
    const times = [];

    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await axios.get(`${API}${ep}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        times.push(Date.now() - start);
      } catch {
        times.push(-1);
      }
    }

    const valid = times.filter(t => t >= 0);
    if (valid.length === 0) continue;

    const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    const max = Math.max(...valid);
    const min = Math.min(...valid);

    REPORT.api[ep] = { avg, min, max, samples: valid.length };

    const icon = avg < 100 ? '🟢' : avg < 300 ? '🟡' : '🔴';
    console.log(`  ${icon} ${ep.padEnd(25)} avg: ${String(avg).padStart(4)}ms  (${min}–${max}ms)`);

    if (avg > 500) {
      REPORT.recommendations.push(`Slow endpoint: ${ep} (avg ${avg}ms) — добавить индексы / оптимизировать запрос`);
    }
  }
}

// ─────────────────────────────────────────────
// 2. FRONTEND PAGE LOAD TIMES
// ─────────────────────────────────────────────
async function testFrontendPerformance(token) {
  console.log('\n══ FRONTEND LOAD TIMES ══');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login via UI
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'admin@med.com');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(2000);

  const pages = [
    '/dashboard',
    '/patients',
    '/appointments',
    '/rooms',
    '/staff',
    '/lab-catalog',
    '/reports',
    '/notifications',
    '/profile',
  ];

  for (const url of pages) {
    const start = Date.now();
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 30000 });
      const loadTime = Date.now() - start;

      const perfData = await page.evaluate(() => {
        const t = performance.timing;
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        const fp  = performance.getEntriesByName('first-paint')[0];
        return {
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          loadComplete: t.loadEventEnd - t.navigationStart,
          firstPaint: Math.round(fp?.startTime || 0),
          firstContentfulPaint: Math.round(fcp?.startTime || 0),
        };
      });

      REPORT.frontend[url] = { loadTime, ...perfData };

      const icon = loadTime < 1500 ? '🟢' : loadTime < 3000 ? '🟡' : '🔴';
      console.log(
        `  ${icon} ${url.padEnd(20)} load: ${String(loadTime).padStart(4)}ms  FCP: ${String(perfData.firstContentfulPaint).padStart(4)}ms`
      );

      if (loadTime > 3000) {
        REPORT.recommendations.push(`Slow page: ${url} (${loadTime}ms) — проверить bundle splitting`);
      }
    } catch (e) {
      console.log(`  ❌ ${url}: ${e.message.substr(0, 60)}`);
      REPORT.frontend[url] = { error: e.message };
    }
  }

  await browser.close();
}

// ─────────────────────────────────────────────
// 3. BUNDLE SIZE
// ─────────────────────────────────────────────
async function testBundleSize() {
  console.log('\n══ BUNDLE SIZE ══');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  const resources = [];
  page.on('response', async resp => {
    const url = resp.url();
    const ct = resp.headers()['content-type'] || '';
    const isJS  = ct.includes('javascript') || url.match(/\.js(\?|$)/);
    const isCSS = ct.includes('css')        || url.match(/\.css(\?|$)/);
    if ((isJS || isCSS) && url.includes('localhost')) {
      try {
        const buf = await resp.buffer();
        resources.push({
          name: url.split('/').pop().substr(0, 60),
          size: buf.length,
          type: isJS ? 'JS' : 'CSS',
        });
      } catch {}
    }
  });

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForTimeout(2000);
  await browser.close();

  const jsList  = resources.filter(r => r.type === 'JS');
  const cssList = resources.filter(r => r.type === 'CSS');
  const jsTotal  = jsList.reduce((s, r) => s + r.size, 0);
  const cssTotal = cssList.reduce((s, r) => s + r.size, 0);

  REPORT.bundleSize = {
    jsKB:    Math.round(jsTotal  / 1024),
    cssKB:   Math.round(cssTotal / 1024),
    totalKB: Math.round((jsTotal + cssTotal) / 1024),
    files:   resources.length,
    details: resources.map(r => ({ name: r.name, sizeKB: Math.round(r.size / 1024), type: r.type }))
             .sort((a, b) => b.sizeKB - a.sizeKB),
  };

  console.log(`  📦 JS  total: ${REPORT.bundleSize.jsKB} KB (${jsList.length} files)`);
  console.log(`  🎨 CSS total: ${REPORT.bundleSize.cssKB} KB (${cssList.length} files)`);
  console.log(`  📊 TOTAL:     ${REPORT.bundleSize.totalKB} KB`);

  const top3 = REPORT.bundleSize.details.slice(0, 3);
  top3.forEach(f => console.log(`     └─ ${f.type} ${f.name} — ${f.sizeKB} KB`));

  if (REPORT.bundleSize.jsKB > 1500) {
    REPORT.recommendations.push(`Bundle JS large (${REPORT.bundleSize.jsKB} KB) — рассмотреть lazy loading`);
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('⚡ PERFORMANCE TESTS — HIS-MedSystem');
  console.log(`   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  const token = await getToken();
  await testAPIPerformance(token);
  await testFrontendPerformance(token);
  await testBundleSize();

  REPORT.endTime = new Date().toISOString();
  fs.writeFileSync('tests/e2e/performance-results.json', JSON.stringify(REPORT, null, 2));

  // ── Markdown report ──────────────────────────────────
  let md = `# ⚡ Performance Test Report\n\n`;
  md += `> Puppeteer headless Chromium + axios — API timing + frontend metrics\n\n`;
  md += `**Запуск:** ${REPORT.startTime}  \n`;
  md += `**Завершение:** ${REPORT.endTime}\n\n`;
  md += `---\n\n`;

  // Bundle
  md += `## 📦 BUNDLE SIZE\n\n`;
  md += `| Type | Size | Files |\n|------|------|-------|\n`;
  md += `| JavaScript | ${REPORT.bundleSize.jsKB} KB | ${(REPORT.bundleSize.details || []).filter(f => f.type === 'JS').length} |\n`;
  md += `| CSS | ${REPORT.bundleSize.cssKB} KB | ${(REPORT.bundleSize.details || []).filter(f => f.type === 'CSS').length} |\n`;
  md += `| **TOTAL** | **${REPORT.bundleSize.totalKB} KB** | ${REPORT.bundleSize.files} |\n\n`;

  const top5 = (REPORT.bundleSize.details || []).slice(0, 5);
  if (top5.length > 0) {
    md += `### Топ-5 по размеру\n\n`;
    md += `| Файл | Размер | Тип |\n|------|--------|-----|\n`;
    top5.forEach(f => { md += `| \`${f.name}\` | ${f.sizeKB} KB | ${f.type} |\n`; });
    md += `\n`;
  }

  // API
  md += `## 📡 API RESPONSE TIMES\n\n`;
  md += `| Endpoint | Avg | Min | Max | Статус |\n|----------|-----|-----|-----|--------|\n`;
  for (const [ep, t] of Object.entries(REPORT.api)) {
    const status = t.avg < 100 ? '🟢 Fast' : t.avg < 300 ? '🟡 OK' : '🔴 Slow';
    md += `| \`${ep}\` | ${t.avg}ms | ${t.min}ms | ${t.max}ms | ${status} |\n`;
  }
  md += `\n`;

  // Frontend
  md += `## 🎨 FRONTEND LOAD TIMES\n\n`;
  md += `| Страница | Load | FCP | DOMContentLoaded | Статус |\n|---------|------|-----|-----------------|--------|\n`;
  for (const [url, t] of Object.entries(REPORT.frontend)) {
    if (t.error) {
      md += `| \`${url}\` | — | — | — | ❌ ${t.error.substr(0,40)} |\n`;
    } else {
      const status = t.loadTime < 1500 ? '🟢 Fast' : t.loadTime < 3000 ? '🟡 OK' : '🔴 Slow';
      md += `| \`${url}\` | ${t.loadTime}ms | ${t.firstContentfulPaint}ms | ${t.domContentLoaded}ms | ${status} |\n`;
    }
  }
  md += `\n`;

  // Recommendations
  if (REPORT.recommendations.length > 0) {
    md += `## 🎯 РЕКОМЕНДАЦИИ\n\n`;
    REPORT.recommendations.forEach(r => { md += `- ${r}\n`; });
  } else {
    md += `## ✅ ВСЁ В НОРМЕ\n\nНикаких заметных проблем с производительностью не обнаружено.\n`;
  }

  md += `\n---\n_Автоматически сгенерировано — ${new Date().toISOString()}_\n`;
  fs.writeFileSync('PERFORMANCE_REPORT.md', md);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  📄 API_perf: ${Object.keys(REPORT.api).length} endpoints`);
  console.log(`  🎨 Frontend: ${Object.keys(REPORT.frontend).length} pages`);
  console.log(`  📦 Bundle:   ${REPORT.bundleSize.totalKB} KB total`);
  console.log(`  🎯 Рекомендаций: ${REPORT.recommendations.length}`);
  console.log(`  📄 Отчёт: PERFORMANCE_REPORT.md`);
  console.log(`═══════════════════════════════════════════\n`);
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
