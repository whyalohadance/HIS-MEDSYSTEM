// Lighthouse audit for HIS-MedSystem
// Uses Playwright's Chromium — Puppeteer's bundled Chrome hangs on macOS 26 (Tahoe)
const { chromium: playwrightChromium } = require('./node_modules/playwright');
const CHROMIUM_PATH = playwrightChromium.executablePath();

const lighthouse = require('./node_modules/lighthouse').default;
const chromeLauncher = require('./node_modules/chrome-launcher');
const fs = require('fs');
const axios = require('../node_modules/axios');

const BASE = 'http://localhost';
const API  = 'http://localhost:3000/api';

const PAGES_TO_AUDIT = [
  { url: '/auth/login',   name: 'Login',        requiresAuth: false },
  { url: '/dashboard',    name: 'Dashboard',    requiresAuth: true  },
  { url: '/patients',     name: 'Patients',     requiresAuth: true  },
  { url: '/appointments', name: 'Appointments', requiresAuth: true  },
  { url: '/staff',        name: 'Staff',        requiresAuth: true  },
  { url: '/profile',      name: 'Profile',      requiresAuth: true  },
  { url: '/lab-catalog',  name: 'Lab Catalog',  requiresAuth: true  },
  { url: '/reports',      name: 'Reports',      requiresAuth: true  },
];

const REPORT = {
  startTime: new Date().toISOString(),
  results: [],
  summary: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
};

async function getAuthToken() {
  try {
    const res = await axios.post(`${API}/auth/login`, {
      email: 'admin@med.com',
      password: 'password123',
    });
    return res.data?.data?.accessToken || null;
  } catch {
    return null;
  }
}

async function runLighthouse(url, token, idx, total) {
  console.log(`\n[${idx}/${total}] 🔬 Auditing ${url}`);

  const chrome = await chromeLauncher.launch({
    chromePath: CHROMIUM_PATH,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  };

  if (token) {
    options.extraHeaders = { Authorization: `Bearer ${token}` };
  }

  try {
    const runnerResult = await lighthouse(`${BASE}${url}`, options);
    const categories = runnerResult.lhr.categories;
    const audits     = runnerResult.lhr.audits;

    const result = {
      url,
      scores: {
        performance:   Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo:           Math.round(categories.seo.score * 100),
      },
      metrics: {
        FCP: Math.round(audits['first-contentful-paint'].numericValue),
        LCP: Math.round(audits['largest-contentful-paint'].numericValue),
        TBT: Math.round(audits['total-blocking-time'].numericValue),
        CLS: parseFloat(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
        SI:  Math.round(audits['speed-index'].numericValue),
        TTI: Math.round((audits['interactive']?.numericValue) || 0),
      },
      failedAudits: [],
    };

    for (const [key, audit] of Object.entries(audits)) {
      if (
        audit.score !== null &&
        audit.score < 0.9 &&
        audit.scoreDisplayMode !== 'notApplicable' &&
        audit.scoreDisplayMode !== 'informative'
      ) {
        result.failedAudits.push({
          id:           key,
          title:        audit.title,
          score:        audit.score,
          displayValue: audit.displayValue || '',
          description:  (audit.description || '').substring(0, 200),
        });
      }
    }

    console.log(`  🚀 Performance:    ${result.scores.performance}/100`);
    console.log(`  ♿ Accessibility:  ${result.scores.accessibility}/100`);
    console.log(`  ✨ Best Practices: ${result.scores.bestPractices}/100`);
    console.log(`  🔍 SEO:            ${result.scores.seo}/100`);
    console.log(`  FCP: ${result.metrics.FCP}ms | LCP: ${result.metrics.LCP}ms | TBT: ${result.metrics.TBT}ms | CLS: ${result.metrics.CLS}`);

    REPORT.results.push(result);
    await chrome.kill();
    return result;
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`);
    await chrome.kill();
    return null;
  }
}

function gradeIt(score) {
  if (score >= 90) return '🟢 Отлично';
  if (score >= 70) return '🟡 Хорошо';
  if (score >= 50) return '🟠 Средне';
  return '🔴 Плохо';
}

function emoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

function generateMarkdown() {
  const s = REPORT.summary;
  let md = `# 🔬 Lighthouse Audit Report\n\n`;
  md += `> Google Lighthouse — Performance, Accessibility, Best Practices, SEO\n\n`;
  md += `**Запуск:** ${REPORT.startTime}  \n`;
  md += `**Завершение:** ${REPORT.endTime}\n\n`;
  md += `---\n\n`;

  md += `## 📊 СРЕДНИЕ БАЛЛЫ\n\n`;
  md += `| Категория | Балл | Оценка |\n|-----------|------|--------|\n`;
  md += `| 🚀 Performance   | ${s.performance}/100   | ${gradeIt(s.performance)} |\n`;
  md += `| ♿ Accessibility  | ${s.accessibility}/100 | ${gradeIt(s.accessibility)} |\n`;
  md += `| ✨ Best Practices | ${s.bestPractices}/100  | ${gradeIt(s.bestPractices)} |\n`;
  md += `| 🔍 SEO            | ${s.seo}/100           | ${gradeIt(s.seo)} |\n\n`;
  md += `---\n\n`;

  md += `## 📋 ДЕТАЛИ ПО СТРАНИЦАМ\n\n`;
  md += `| Страница | Perf | A11y | Best | SEO | FCP | LCP | TBT | CLS |\n`;
  md += `|----------|------|------|------|-----|-----|-----|-----|-----|\n`;
  for (const r of REPORT.results) {
    md += `| \`${r.url}\` `;
    md += `| ${emoji(r.scores.performance)} ${r.scores.performance} `;
    md += `| ${emoji(r.scores.accessibility)} ${r.scores.accessibility} `;
    md += `| ${emoji(r.scores.bestPractices)} ${r.scores.bestPractices} `;
    md += `| ${emoji(r.scores.seo)} ${r.scores.seo} `;
    md += `| ${r.metrics.FCP}ms | ${r.metrics.LCP}ms | ${r.metrics.TBT}ms | ${r.metrics.CLS} |\n`;
  }
  md += `\n---\n\n`;

  // Top failed audits aggregated across pages
  const auditMap = {};
  for (const r of REPORT.results) {
    for (const a of r.failedAudits) {
      if (!auditMap[a.id]) auditMap[a.id] = { ...a, pages: [] };
      auditMap[a.id].pages.push(r.url);
    }
  }
  const topIssues = Object.values(auditMap)
    .sort((a, b) => b.pages.length - a.pages.length || (a.score || 0) - (b.score || 0))
    .slice(0, 15);

  if (topIssues.length > 0) {
    md += `## 🚨 ТОП ПРОБЛЕМ\n\n`;
    md += `| Аудит | Страниц | Значение |\n|-------|---------|----------|\n`;
    for (const issue of topIssues) {
      const pagesStr = issue.pages.slice(0, 2).join(', ') + (issue.pages.length > 2 ? `… +${issue.pages.length - 2}` : '');
      md += `| ${issue.title} | ${issue.pages.length} (${pagesStr}) | ${issue.displayValue || '—'} |\n`;
    }
    md += `\n---\n\n`;
  } else {
    md += `## ✅ КРИТИЧЕСКИХ ПРОБЛЕМ НЕ НАЙДЕНО\n\n---\n\n`;
  }

  md += `## 🎯 РЕКОМЕНДАЦИИ\n\n`;
  if (s.performance < 90) {
    md += `### 🚀 Performance\n`;
    md += `- Lazy loading роутов (\`loadChildren\` — уже используется в Angular)\n`;
    md += `- Уменьшить TBT: разбить тяжёлые задачи на микрозадачи\n`;
    md += `- Preload critical fonts (уже есть preconnect к Google Fonts)\n\n`;
  }
  if (s.accessibility < 90) {
    md += `### ♿ Accessibility\n`;
    md += `- Контраст текста >= 4.5:1 (WCAG AA)\n`;
    md += `- \`aria-label\` для кнопок с только иконками (Material Icons)\n`;
    md += `- \`<label>\` для всех form inputs\n\n`;
  }
  if (s.bestPractices < 90) {
    md += `### ✨ Best Practices\n`;
    md += `- HTTPS в production (localhost — HTTP, поэтому снижение)\n`;
    md += `- Устранить console errors/warnings\n\n`;
  }
  if (s.seo < 90) {
    md += `### 🔍 SEO\n`;
    md += `- Meta description добавлен в index.html ✅\n`;
    md += `- Title добавлен в index.html ✅\n`;
    md += `- Angular Title service для динамических заголовков страниц\n\n`;
  }

  md += `---\n\n## 📈 СРАВНЕНИЕ СО СТАНДАРТАМИ\n\n`;
  md += `| Стандарт | Performance | Accessibility | Best Practices | SEO |\n`;
  md += `|----------|-------------|---------------|----------------|-----|\n`;
  md += `| Google Excellent (🟢) | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |\n`;
  md += `| Google Good (🟡) | ≥ 70 | ≥ 85 | ≥ 70 | ≥ 70 |\n`;
  md += `| Минимум | ≥ 50 | ≥ 70 | ≥ 50 | ≥ 50 |\n`;
  md += `| **HIS-MedSystem** | **${s.performance}** | **${s.accessibility}** | **${s.bestPractices}** | **${s.seo}** |\n\n`;

  md += `> ℹ️ Performance тестируется на localhost (HTTP, без CDN, без кеширования) — в production цифры будут выше.\n\n`;
  md += `---\n\n_Сгенерировано Google Lighthouse — ${REPORT.endTime}_\n`;

  fs.writeFileSync('LIGHTHOUSE_REPORT.md', md);
  console.log('\n📄 LIGHTHOUSE_REPORT.md сохранён');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🔬 LIGHTHOUSE AUDIT — HIS-MedSystem');
  console.log(`   ${new Date().toISOString()}`);
  console.log(`   Chromium: ${CHROMIUM_PATH.split('/').slice(-4).join('/')}`);
  console.log('═══════════════════════════════════════════');

  const token = await getAuthToken();
  console.log(token ? `\n✅ Auth token obtained` : `\n⚠️  No token — auditing without auth`);

  for (let i = 0; i < PAGES_TO_AUDIT.length; i++) {
    const page = PAGES_TO_AUDIT[i];
    await runLighthouse(page.url, page.requiresAuth ? token : null, i + 1, PAGES_TO_AUDIT.length);
    // Small pause between runs to let Chrome ports free up
    await new Promise(r => setTimeout(r, 1500));
  }

  const valid = REPORT.results.filter(Boolean);
  if (valid.length > 0) {
    REPORT.summary.performance   = Math.round(valid.reduce((s, r) => s + r.scores.performance,   0) / valid.length);
    REPORT.summary.accessibility = Math.round(valid.reduce((s, r) => s + r.scores.accessibility, 0) / valid.length);
    REPORT.summary.bestPractices = Math.round(valid.reduce((s, r) => s + r.scores.bestPractices, 0) / valid.length);
    REPORT.summary.seo           = Math.round(valid.reduce((s, r) => s + r.scores.seo,           0) / valid.length);
  }
  REPORT.endTime = new Date().toISOString();

  fs.writeFileSync('tests/e2e/lighthouse-results.json', JSON.stringify(REPORT, null, 2));
  generateMarkdown();

  const s = REPORT.summary;
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ LIGHTHOUSE AUDIT COMPLETED');
  console.log('\n📊 СРЕДНИЕ БАЛЛЫ:');
  console.log(`  Performance:    ${s.performance}/100  ${gradeIt(s.performance)}`);
  console.log(`  Accessibility:  ${s.accessibility}/100  ${gradeIt(s.accessibility)}`);
  console.log(`  Best Practices: ${s.bestPractices}/100  ${gradeIt(s.bestPractices)}`);
  console.log(`  SEO:            ${s.seo}/100  ${gradeIt(s.seo)}`);
  console.log('\n📄 Отчёт: LIGHTHOUSE_REPORT.md');
  console.log('═══════════════════════════════════════════');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
