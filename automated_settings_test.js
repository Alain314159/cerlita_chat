const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando Prueba de Navegación y Ajustes...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();

  page.on('dialog', async d => await d.accept());
  page.on('console', msg => console.log(`[CONSOLE] ${msg.text()}`));

  try {
    const timestamp = Date.now();
    const email = `test_${timestamp}@example.com`;
    const name = `AlainTest_${timestamp}`;

    console.log(`🔗 Registrando a ${name}...`);
    await page.goto('http://localhost:8082/register');
    await page.waitForSelector('input');
    const inputs = await page.$$('input');
    await inputs[0].fill(name);
    await inputs[1].fill(email);
    await inputs[2].fill('Password123!');
    await inputs[3].fill('Password123!');
    await page.click('button:has-text("Crear Cuenta"), [role="button"]:has-text("Crear Cuenta")');

    console.log('⏳ Esperando al Dashboard...');
    await page.waitForTimeout(5000);
    // Forzar navegación al home si se queda pegado
    if (page.url().includes('register')) await page.goto('http://localhost:8082/(chat)');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step_01_dashboard.png' });

    console.log('🧭 Navegando a Ajustes...');
    // En Expo Router Tabs, la ruta suele ser /settings
    await page.goto('http://localhost:8082/settings');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step_02_settings.png' });

    const content = await page.evaluate(() => document.body.innerText);
    console.log('📝 Contenido de Ajustes:', content.substring(0, 300));

    if (content.includes('Perfil') || content.includes('Cerrar Sesión')) {
      console.log('✅ Ajustes cargados correctamente.');
    } else {
      console.log('⚠️ Ajustes parece vacío o diferente a lo esperado.');
    }

  } catch (err) {
    console.error('❌ Error:', err);
    await page.screenshot({ path: 'step_error.png' });
  } finally {
    await browser.close();
  }
})();
