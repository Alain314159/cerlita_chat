const { chromium } = require('playwright');

(async () => {
  console.log('👀 Inspeccionando lista de usuarios en New Chat...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();

  try {
    // Login rápido
    await page.goto('http://localhost:8082/login');
    await page.waitForSelector('input');
    const inputs = await page.$$('input');
    await inputs[0].fill('alain_a_1777920096852@test.com');
    await inputs[1].fill('Password123!');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForTimeout(5000);

    // Ir a New Chat
    await page.goto('http://localhost:8082/new-chat');
    await page.waitForTimeout(5000);
    
    const content = await page.evaluate(() => document.body.innerText);
    console.log('📄 Usuarios visibles en pantalla:\n', content);
    
    await page.screenshot({ path: 'inspection_new_chat_list.png' });
    console.log('✅ Inspección completada. Revisa inspection_new_chat_list.png');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await browser.close();
  }
})();
