const { chromium } = require('playwright');

(async () => {
  console.log('Iniciando prueba de Web Local (puerto 8082)...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  const url = 'http://localhost:8082';

  try {
    console.log(`Navegando a ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Esperando 5 segundos...');
    await page.waitForTimeout(5000);
    
    const screenshotPath = 'local_web_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Captura guardada en: ${screenshotPath}`);
    
    const title = await page.title();
    console.log(`Título de la página: ${title}`);
    
    const isErrorVisible = await page.evaluate(() => document.body.innerText.includes('Algo salió mal'));
    console.log(`¿Pantalla de error visible?: ${isErrorVisible}`);

    const bodyContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log(`Texto inicial: ${bodyContent}...`);

  } catch (err) {
    console.error('Error durante la prueba local:', err);
  } finally {
    await browser.close();
  }
})();
