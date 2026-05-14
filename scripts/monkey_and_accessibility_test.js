const { chromium } = require('playwright');

(async () => {
  console.log('🐒 Iniciando Monkey Testing y Auditoría de Accesibilidad...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:8082/login');
    await page.waitForTimeout(3000);

    // --- ACCESIBILIDAD ---
    console.log('♿ Auditando etiquetas de accesibilidad...');
    const buttons = await page.$$('[role="button"]');
    for (const btn of buttons) {
        const label = await btn.getAttribute('aria-label') || await btn.innerText();
        console.log(`   - Botón encontrado: "${label.trim()}"`);
    }

    // --- MONKEY TESTING ---
    console.log('🐒 Ejecutando Monkey Testing (10 acciones aleatorias)...');
    const selectors = ['button', 'input', 'a', '[role="button"]'];
    
    for (let i = 0; i < 10; i++) {
        const selector = selectors[Math.floor(Math.random() * selectors.length)];
        const elements = await page.$$(selector);
        if (elements.length > 0) {
            const el = elements[Math.floor(Math.random() * elements.length)];
            const isVisible = await el.isVisible();
            if (isVisible) {
                console.log(`   [Action ${i+1}] Clic aleatorio en: ${selector}`);
                await el.click().catch(() => {});
                await page.waitForTimeout(500);
            }
        }
    }
    
    await page.screenshot({ path: 'test_monkey_result.png' });

    // --- OFFLINE TEST ---
    console.log('🌐 Probando comportamiento Offline...');
    await context.setOffline(true);
    await page.reload().catch(() => console.log('   (Esperado) Fallo al recargar en offline'));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_offline_state.png' });
    
    console.log('✅ Batería de pruebas completada.');

  } catch (err) {
    console.error('❌ Fallo:', err);
  } finally {
    await browser.close();
  }
})();
