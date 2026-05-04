const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Iniciando prueba de GitHub Pages...');
  
  // Forzamos el uso del path efímero si no está en el ambiente
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necesario en algunos entornos de contenedores
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

  const url = 'https://Alain314159.github.io/cerlita_chat';

  try {
    console.log(`Navegando a ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('Esperando a que la aplicación cargue...');
    await page.waitForTimeout(5000); // Dar tiempo a que cargue el JS de Expo
    
    const screenshotPath = 'gh_pages_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Captura guardada en: ${screenshotPath}`);
    
    const title = await page.title();
    console.log(`Título de la página: ${title}`);
    
    // Verificar si hay algún elemento clave que indique que cargó bien
    const rootVisible = await page.isVisible('#root');
    console.log(`¿Elemento #root visible?: ${rootVisible}`);

    const bodyContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log(`Texto inicial: ${bodyContent}...`);

  } catch (err) {
    console.error('Error durante la prueba:', err);
    // Tomar captura de error
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
})();
