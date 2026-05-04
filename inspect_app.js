const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capturar logs de consola
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  // Capturar errores no manejados
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  try {
    console.log('Navegando a http://localhost:8081...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
    
    // Esperar un poco por si hay animaciones de splash
    await page.waitForTimeout(3000);
    
    const screenshotPath = 'screenshot_app.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Captura guardada en: ${screenshotPath}`);
    
    const title = await page.title();
    console.log(`Título de la página: ${title}`);
    
    const bodyContent = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log(`Contenido inicial del body: ${bodyContent}...`);

  } catch (err) {
    console.error('Error durante la inspección:', err);
  } finally {
    await browser.close();
  }
})();
