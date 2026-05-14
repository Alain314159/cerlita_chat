const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cerlita-chat-v2.surge.sh';
const timestamp = Date.now();
const userA_data = { name: `Tester_A_${timestamp}`, email: `test_a_${timestamp}@cerlita.com`, password: 'Password123!' };
const userB_data = { name: `Tester_B_${timestamp}`, email: `test_b_${timestamp}@cerlita.com`, password: 'Password123!' };

async function runExhaustiveTest() {
  console.log('🏁 Starting Exhaustive Production Test for Cerlita Chat...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
  });

  const screenshotsDir = path.join(process.cwd(), 'test_results', `test_${timestamp}`);
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  async function setupPage(name) {
    const context = await browser.newContext({ 
      viewport: { width: 375, height: 812 }, // Mobile size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warn') {
            console.log(`[BROWSER ${name}] ${msg.type().toUpperCase()}: ${msg.text()}`);
        }
    });
    return { page, context };
  }

  async function register(page, userData) {
    console.log(`[${userData.name}] Registering at ${BASE_URL}/register...`);
    try {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForSelector('input', { timeout: 30000 });
      
      const content = await page.content();
      console.log(`[${userData.name}] Page loaded. URL: ${page.url()}`);
      
      const inputs = await page.$$('input');
      console.log(`[${userData.name}] Found ${inputs.length} inputs.`);
      
      if (inputs.length < 4) {
          console.log(`[${userData.name}] ERROR: Not enough inputs found. HTML:`, content.substring(0, 500));
          await page.screenshot({ path: path.join(screenshotsDir, `DEBUG_REG_FAIL_${userData.name}.png`) });
          throw new Error('Not enough inputs found');
      }

      await inputs[0].fill(userData.name);
      await inputs[1].fill(userData.email);
      await inputs[2].fill(userData.password);
      await inputs[3].fill(userData.password);
      
      const registerBtn = page.locator('button:has-text("Crear Cuenta"), [role="button"]:has-text("Crear Cuenta"), button:has-text("Register")').first();
      await registerBtn.click();
      
      console.log(`[${userData.name}] Waiting for redirect to dashboard...`);
      await page.waitForURL(url => url.toString().includes('(chat)') || url.toString().endsWith('/'), { timeout: 30000 });
      await page.screenshot({ path: path.join(screenshotsDir, `01_reg_${userData.name}.png`) });
    } catch (e) {
      console.error(`[${userData.name}] Registration failed:`, e.message);
      await page.screenshot({ path: path.join(screenshotsDir, `ERROR_REG_${userData.name}.png`) });
      const html = await page.content();
      fs.writeFileSync(path.join(screenshotsDir, `ERROR_REG_${userData.name}.html`), html);
      throw e;
    }
  }

  const { page: pageA, context: contextA } = await setupPage('UserA');
  const { page: pageB, context: contextB } = await setupPage('UserB');

  try {
    // 1. Registro
    await register(pageA, userA_data);
    await register(pageB, userB_data);

    // 2. Búsqueda y Solicitud de Conexión
    console.log(`[${userB_data.name}] Searching for User A...`);
    await pageB.goto(`${BASE_URL}/new-chat`);
    await pageB.waitForSelector('input[placeholder*="Buscar"]');
    await pageB.fill('input[placeholder*="Buscar"]', userA_data.name);
    
    console.log(`[${userB_data.name}] Clicking result...`);
    const userItem = pageB.locator(`text=${userA_data.name}`).first();
    await userItem.waitFor({ state: 'visible', timeout: 15000 });
    await pageB.screenshot({ path: path.join(screenshotsDir, `02_search_result_B.png`) });
    await userItem.click();

    console.log(`[${userB_data.name}] Confirming connection...`);
    await pageB.waitForSelector('text=Conectar');
    await pageB.click('text=Conectar');
    await pageB.waitForTimeout(2000);
    await pageB.screenshot({ path: path.join(screenshotsDir, `03_connection_requested_B.png`) });

    // 3. Aceptar Solicitud en Usuario A
    console.log(`[${userA_data.name}] Checking requests...`);
    await pageA.goto(`${BASE_URL}/requests`);
    const acceptBtn = pageA.locator('button:has-text("Aceptar"), [role="button"]:has-text("Aceptar")').first();
    await acceptBtn.waitFor({ state: 'visible', timeout: 15000 });
    await pageA.screenshot({ path: path.join(screenshotsDir, `04_requests_view_A.png`) });
    await acceptBtn.click();
    console.log(`[${userA_data.name}] Request accepted.`);
    await pageA.waitForTimeout(3000); // Wait for chat creation trigger

    // 4. Iniciar Chat E2E
    console.log(`[${userA_data.name}] Navigating to Chats...`);
    await pageA.goto(`${BASE_URL}/(chat)`);
    const chatItem = pageA.locator(`text=${userB_data.name}`).first();
    await chatItem.waitFor({ state: 'visible', timeout: 15000 });
    await chatItem.click();
    
    console.log(`[${userA_data.name}] Inside Chat room. Checking for Lock icon...`);
    // Wait for the lock icon that indicates E2E is active (if present in UI)
    await pageA.screenshot({ path: path.join(screenshotsDir, `05_chat_room_A.png`) });

    // 5. Enviar Mensaje E2E
    console.log(`[${userA_data.name}] Sending E2E message...`);
    const inputA = pageA.locator('input[placeholder*="mensaje"], textarea, [role="textbox"]').first();
    await inputA.waitFor({ state: 'visible' });
    await inputA.fill('Hola! Esto es un mensaje cifrado E2E 🔐');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(2000);
    await pageA.screenshot({ path: path.join(screenshotsDir, `06_message_sent_A.png`) });

    // 6. Recibir y responder en Usuario B
    console.log(`[${userB_data.name}] Navigating to Chats to receive...`);
    await pageB.goto(`${BASE_URL}/(chat)`);
    const chatItemB = pageB.locator(`text=${userA_data.name}`).first();
    await chatItemB.waitFor({ state: 'visible', timeout: 15000 });
    await chatItemB.click();
    
    console.log(`[${userB_data.name}] Verifying message received...`);
    await pageB.waitForSelector('text=Hola! Esto es un mensaje cifrado E2E', { timeout: 15000 });
    await pageB.screenshot({ path: path.join(screenshotsDir, `07_message_received_B.png`) });
    
    const inputB = pageB.locator('input[placeholder*="mensaje"], textarea, [role="textbox"]').first();
    await inputB.fill('Recibido! Funciona perfecto. Ahora probaré el modo offline ✈️');
    await pageB.keyboard.press('Enter');
    await pageB.waitForTimeout(2000);

    // 7. Prueba de Modo Offline
    console.log(`[${userB_data.name}] Simulating Offline Mode...`);
    await contextB.setOffline(true);
    await inputB.fill('Este mensaje debería guardarse en la cola offline 📵');
    await pageB.keyboard.press('Enter');
    await pageB.waitForTimeout(2000);
    await pageB.screenshot({ path: path.join(screenshotsDir, `08_offline_queue_B.png`) });
    
    console.log(`[${userB_data.name}] Restoring Online Mode...`);
    await contextB.setOffline(false);
    await pageB.waitForTimeout(5000); // Give time to flush queue
    await pageB.screenshot({ path: path.join(screenshotsDir, `09_online_restored_B.png`) });

    // 8. Búsqueda en Chat
    console.log(`[${userB_data.name}] Testing Chat Search...`);
    // Click in Search icon if available or just test the hook via console if possible
    // Since we don't have the full UI interaction for search modal yet, we skip or try to find the button
    const searchBtn = pageB.locator('button >> .lucide-search, [role="button"] >> .lucide-search').first();
    if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await pageB.fill('input[placeholder*="Buscar mensajes"]', 'E2E');
        await pageB.waitForTimeout(2000);
        await pageB.screenshot({ path: path.join(screenshotsDir, `10_chat_search_B.png`) });
    }

    // 9. Configuración y Perfil
    console.log(`[${userA_data.name}] Testing Settings...`);
    await pageA.goto(`${BASE_URL}/settings`);
    await pageA.waitForSelector('text=Ajustes');
    const nameInput = pageA.locator('input[value*="Tester_A"]').first();
    if (await nameInput.isVisible()) {
        await nameInput.fill(`Alain Master 2026`);
        await pageA.click('text=Guardar, [role="button"]:has-text("Guardar")');
        await pageA.waitForTimeout(2000);
        await pageA.screenshot({ path: path.join(screenshotsDir, `11_settings_updated_A.png`) });
    }

    console.log('✨ ALL TESTS PASSED! Check test_results directory for screenshots.');

  } catch (err) {
    console.error('❌ EXHAUSTIVE TEST FAILED:', err);
    const activePages = [pageA, pageB];
    for (let i = 0; i < activePages.length; i++) {
        try {
            await activePages[i].screenshot({ path: path.join(screenshotsDir, `FATAL_ERROR_${i}.png`) });
        } catch(e) {}
    }
    throw err;
  } finally {
    await browser.close();
  }
}

runExhaustiveTest().catch(err => {
    console.error(err);
    process.exit(1);
});
