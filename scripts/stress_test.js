const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cerlita-chat-v2.surge.sh';
const ITERATIONS = 5;

async function runIteration(id) {
  const timestamp = Date.now();
  const userA_data = { name: `A_${id}_${timestamp}`, email: `a_${id}_${timestamp}@test.com`, password: 'Password123!' };
  const userB_data = { name: `B_${id}_${timestamp}`, email: `b_${id}_${timestamp}@test.com`, password: 'Password123!' };
  
  console.log(`\n🔄 Starting Iteration ${id}/5...`);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const screenshotsDir = path.join(process.cwd(), 'test_results', `iter_${id}`);
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const contextA = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const contextB = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  async function register(page, user) {
    console.log(`   [${user.name}] Registering at ${BASE_URL}/register...`);
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    
    // Esperar a que los inputs estén listos
    await page.waitForSelector('input', { timeout: 30000 });
    const inputs = await page.$$('input');
    
    if (inputs.length >= 4) {
      await inputs[0].fill(user.name);
      await inputs[1].fill(user.email);
      await inputs[2].fill(user.password);
      await inputs[3].fill(user.password);
    } else {
      throw new Error(`Expected at least 4 inputs, found ${inputs.length}`);
    }

    await page.click('button:has-text("Crear Cuenta"), [role="button"]:has-text("Crear Cuenta")');
    
    // Esperar redirección o mensaje de éxito
    try {
      await page.waitForURL(url => url.toString().includes('(chat)') || url.toString().endsWith('/'), { timeout: 30000 });
    } catch (e) {
      const errorMsg = await page.textContent('body');
      if (errorMsg.includes('User already registered') || errorMsg.includes('exist')) {
        console.log(`   [${user.name}] User already exists, proceeding to login...`);
        await page.goto(`${BASE_URL}/login`);
        const loginInputs = await page.$$('input');
        await loginInputs[0].fill(user.email);
        await loginInputs[1].fill(user.password);
        await page.click('button:has-text("Entrar"), [role="button"]:has-text("Entrar")');
        await page.waitForURL(url => url.toString().includes('(chat)'), { timeout: 30000 });
      } else {
        throw e;
      }
    }
  }

  try {
    await register(pageA, userA_data);
    await register(pageB, userB_data);

    // Búsqueda y conexión
    console.log(`   [${userB_data.name}] Requesting connection...`);
    await pageB.goto(`${BASE_URL}/new-chat`);
    await pageB.fill('input[placeholder*="Buscar"]', userA_data.name);
    await pageB.click(`text=${userA_data.name}`);
    await pageB.click('text=Conectar');
    await pageB.waitForTimeout(2000);

    // Aceptar
    console.log(`   [${userA_data.name}] Accepting...`);
    await pageA.goto(`${BASE_URL}/requests`);
    await pageA.click('button:has-text("Aceptar"), [role="button"]:has-text("Aceptar")');
    await pageA.waitForTimeout(3000);

    // Mensaje E2E
    console.log(`   [${userA_data.name}] Sending E2E message...`);
    await pageA.goto(`${BASE_URL}/(chat)`);
    await pageA.click(`text=${userB_data.name}`);
    const inputA = pageA.locator('input[placeholder*="mensaje"], textarea, [role="textbox"]').first();
    await inputA.fill(`Mensaje iteración ${id} 🔐`);
    await pageA.keyboard.press('Enter');

    // Verificar recepción
    console.log(`   [${userB_data.name}] Verifying reception...`);
    await pageB.goto(`${BASE_URL}/(chat)`);
    await pageB.click(`text=${userA_data.name}`);
    await pageB.waitForSelector(`text=Mensaje iteración ${id}`, { timeout: 10000 });
    
    await pageB.screenshot({ path: path.join(screenshotsDir, 'success.png') });
    console.log(`✅ Iteration ${id} successful.`);
  } catch (err) {
    console.error(`❌ Iteration ${id} failed:`, err.message);
    await pageA.screenshot({ path: path.join(screenshotsDir, 'error_A.png') });
    await pageB.screenshot({ path: path.join(screenshotsDir, 'error_B.png') });
  } finally {
    await browser.close();
  }
}

(async () => {
  for (let i = 1; i <= ITERATIONS; i++) {
    await runIteration(i);
  }
})();
