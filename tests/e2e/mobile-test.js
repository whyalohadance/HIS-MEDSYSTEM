// Puppeteer's bundled Chromium crashes on macOS 26 (Tahoe) — use Playwright's Chromium instead
const { chromium: playwrightChromium } = require('./node_modules/playwright');
const CHROMIUM_PATH = playwrightChromium.executablePath();
const puppeteer = require('./node_modules/puppeteer');
const fs = require('fs');

const BASE = 'http://localhost';
const REPORT = {
  startTime: new Date().toISOString(),
  total: 0,
  passed: 0,
  failed: 0,
  issues: [],
  screenshots: []
};

const VIEWPORTS = [
  { name: 'mobile-xs',  width: 320,  height: 568,  label: 'iPhone SE' },
  { name: 'mobile-sm',  width: 375,  height: 667,  label: 'iPhone 8' },
  { name: 'mobile-md',  width: 414,  height: 896,  label: 'iPhone 11' },
  { name: 'tablet',     width: 768,  height: 1024, label: 'iPad' },
  { name: 'laptop',     width: 1024, height: 768,  label: 'Laptop' },
  { name: 'desktop',    width: 1440, height: 900,  label: 'Desktop' }
];

const PAGES = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/rooms',
  '/staff',
  '/profile',
  '/lab-catalog',
  '/lab/worklist',
  '/lab/orders',
  '/reports'
];

function check(name, condition, viewport, details = '') {
  REPORT.total++;
  if (condition) {
    REPORT.passed++;
    console.log(`  ✅ ${viewport} ${name}`);
  } else {
    REPORT.failed++;
    REPORT.issues.push({ viewport, page: name, details });
    console.log(`  ❌ ${viewport} ${name} → ${details}`);
  }
}

async function login(page) {
  // Angular login route is /auth/login
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'admin@med.com');
  await page.type('input[type="password"]', 'password123');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(2000);
}

async function testViewport(browser, vp) {
  console.log(`\n══ ${vp.label} (${vp.width}x${vp.height}) ══`);

  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

  await login(page);

  const screenDir = `tests/e2e/screenshots/${vp.name}`;
  if (!fs.existsSync(screenDir)) fs.mkdirSync(screenDir, { recursive: true });

  for (const pagePath of PAGES) {
    try {
      await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(1500);

      // Screenshot
      const safeName = pagePath.replace(/\//g, '_') || '_root';
      const screenshotPath = `${screenDir}/${safeName}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      REPORT.screenshots.push(screenshotPath);

      // 1. Horizontal scroll check
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
      });
      check(pagePath, !hasHorizontalScroll, vp.name,
        hasHorizontalScroll ? 'Горизонтальный скролл!' : '');

      // 2. Small button check (mobile only)
      if (vp.width <= 414) {
        const smallButtons = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a[href]');
          let small = 0;
          buttons.forEach(b => {
            const rect = b.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
              small++;
            }
          });
          return { total: buttons.length, small };
        });
        check(`${pagePath} button sizes`, smallButtons.small < 5, vp.name,
          smallButtons.small > 0 ? `${smallButtons.small}/${smallButtons.total} кнопок < 44px` : '');
      }

      // 3. Content overflow check
      const overflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let count = 0;
        for (let i = 0; i < Math.min(elements.length, 1000); i++) {
          const el = elements[i];
          // Skip elements that are not visible (hidden via display:none, *ngIf, etc.)
          // clientWidth < 20 catches near-invisible containers (e.g. role-specific dashboards)
          if (el.clientWidth === 0 || el.clientHeight === 0) continue;
          if (el.clientWidth < 20) continue;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (
            el.scrollWidth > el.clientWidth + 5 &&
            style.overflowX !== 'auto' &&
            style.overflowX !== 'scroll' &&
            style.overflowX !== 'hidden'
          ) {
            count++;
          }
        }
        return count;
      });
      check(`${pagePath} overflow`, overflow < 5, vp.name,
        overflow > 0 ? `${overflow} элементов выходят за пределы` : '');

    } catch (e) {
      check(pagePath, false, vp.name, e.message.substr(0, 80));
    }
  }

  await page.close();
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('📱 MOBILE/RESPONSIVE TESTS — HIS-MedSystem');
  console.log(`   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  for (const vp of VIEWPORTS) {
    await testViewport(browser, vp);
  }

  await browser.close();

  REPORT.endTime = new Date().toISOString();
  fs.writeFileSync('tests/e2e/mobile-results.json', JSON.stringify(REPORT, null, 2));

  // Generate Markdown
  const pct = Math.round(REPORT.passed / REPORT.total * 100);
  const statusIcon = pct === 100 ? '🟢' : pct >= 80 ? '🟡' : '🔴';

  let md = `# 📱 Mobile/Responsive Test Report\n\n`;
  md += `> Playwright Puppeteer — headless Chromium, 6 viewports × 10 страниц\n\n`;
  md += `**Запуск:** ${REPORT.startTime}  \n`;
  md += `**Завершение:** ${REPORT.endTime}\n\n`;
  md += `---\n\n`;

  md += `## 📊 ОБЩАЯ СТАТИСТИКА\n\n`;
  md += `| Метрика | Значение | Статус |\n|---------|----------|--------|\n`;
  md += `| Всего проверок | ${REPORT.total} | — |\n`;
  md += `| ✅ Прошло | ${REPORT.passed} | 🟢 OK |\n`;
  md += `| ❌ Проблемы | ${REPORT.failed} | ${REPORT.failed === 0 ? '🟢 OK' : '🔴'} |\n`;
  md += `| Score | ${pct}% | ${statusIcon} |\n`;
  md += `| Viewport'ов | ${VIEWPORTS.length} | — |\n`;
  md += `| Страниц | ${PAGES.length} | — |\n`;
  md += `| Скриншотов | ${REPORT.screenshots.length} | — |\n\n`;

  md += `## 📐 ПРОТЕСТИРОВАННЫЕ VIEWPORT'Ы\n\n`;
  md += `| Устройство | Ширина | Высота |\n|-----------|--------|--------|\n`;
  for (const vp of VIEWPORTS) {
    md += `| ${vp.label} | ${vp.width}px | ${vp.height}px |\n`;
  }
  md += `\n`;

  if (REPORT.issues.length > 0) {
    md += `## ❌ НАЙДЕННЫЕ ПРОБЛЕМЫ\n\n`;
    md += `| Viewport | Страница | Проблема |\n|----------|----------|----------|\n`;
    for (const issue of REPORT.issues) {
      md += `| \`${issue.viewport}\` | \`${issue.page}\` | ${issue.details} |\n`;
    }
    md += `\n`;
  } else {
    md += `## ✅ ПРОБЛЕМ НЕ ОБНАРУЖЕНО\n\n`;
    md += `Все страницы корректно отображаются на всех 6 viewport'ах.\n\n`;
  }

  md += `## 📸 СКРИНШОТЫ\n\n`;
  md += `Сохранены в \`tests/e2e/screenshots/\`:\n\n`;
  for (const vp of VIEWPORTS) {
    md += `- **${vp.label}** (${vp.width}px) → \`tests/e2e/screenshots/${vp.name}/\`\n`;
  }
  md += `\n---\n_Автоматически сгенерировано — ${new Date().toISOString()}_\n`;

  fs.writeFileSync('MOBILE_REPORT.md', md);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  ✅ Прошло: ${REPORT.passed}/${REPORT.total} (${pct}%)`);
  console.log(`  ❌ Проблемы: ${REPORT.failed}`);
  console.log(`  📸 Скриншотов: ${REPORT.screenshots.length}`);
  console.log(`  📄 Отчёт: MOBILE_REPORT.md`);
  console.log(`═══════════════════════════════════════════\n`);
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
