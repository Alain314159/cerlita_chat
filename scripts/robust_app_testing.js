const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Iniciando Batería de Pruebas de Robustez (Stress & Edge Cases)...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

  try {
    // --- PRUEBA 1: LOGIN FALLIDO ---
    console.log('❌ Prueba 1: Intento de login con credenciales erróneas...');
    await page.goto('http://localhost:8082/login');
    await page.waitForSelector('input');
    const loginInputs = await page.$$('input');
    await loginInputs[0].fill('usuario_falso@test.com');
    await loginInputs[1].fill('PasswordErronea123!');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_robust_01_failed_login.png' });
    console.log('✅ Intento de login fallido capturado.');

    // --- PRUEBA 2: REGISTRO Y PERFIL ---
    const timestamp = Date.now();
    const name = `RobustUser_${timestamp}`;
    const email = `robust_${timestamp}@test.com`;
    console.log(`👤 Prueba 2: Registro de usuario real (${name})...`);
    await page.goto('http://localhost:8082/register');
    await page.waitForSelector('input');
    const regInputs = await page.$$('input');
    await regInputs[0].fill(name);
    await regInputs[1].fill(email);
    await regInputs[2].fill('Password123!');
    await regInputs[3].fill('Password123!');
    await page.click('button:has-text("Crear Cuenta")');
    await page.waitForTimeout(5000);
    
    // Ir a perfil/ajustes
    console.log('⚙️ Verificando Pantalla de Ajustes...');
    await page.goto('http://localhost:8082/settings');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_robust_02_settings.png' });

    // --- PRUEBA 3: BÚSQUEDA DE USUARIO INEXISTENTE ---
    console.log('🔍 Prueba 3: Búsqueda de usuario inexistente...');
    await page.goto('http://localhost:8082/new-chat');
    await page.waitForSelector('input');
    const searchInput = await page.locator('input').first();
    await searchInput.fill('UsuarioQueNoExiste_999999');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_robust_03_empty_search.png' });

    // --- PRUEBA 4: ENVÍO MASIVO DE MENSAJES (STRESS) ---
    console.log('✉️ Prueba 4: Envío masivo de mensajes...');
    // Buscar al Usuario A de la prueba anterior (o a sí mismo si se permite)
    // Para simplificar, buscaremos un nombre común o el nuestro propio
    await searchInput.fill(name);
    await page.waitForTimeout(2000);
    await page.click(`text="${name}"`);
    await page.waitForTimeout(2000);

    const msgInput = await page.locator('input[placeholder*="mensaje"], textarea').first();
    for(let i=1; i<=5; i++) {
        console.log(`   - Enviando mensaje de ráfaga ${i}...`);
        await msgInput.fill(`Mensaje de ráfaga #${i} 🚀`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500); // Ráfaga rápida
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_robust_04_burst_messages.png' });

    console.log('✅ Todas las pruebas de robustez completadas.');

  } catch (err) {
    console.error('❌ Error fatal en robustez:', err);
    await page.screenshot({ path: 'test_robust_fatal.png' });
  } finally {
    await browser.close();
  }
})();
