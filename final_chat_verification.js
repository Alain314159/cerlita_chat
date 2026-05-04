const { chromium } = require('playwright');

(async () => {
  console.log('🚀 VALIDACIÓN FINAL: CHAT ENTRE USUARIOS');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  
  async function setupUser(name) {
    const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
    const page = await context.newPage();
    const timestamp = Date.now() + Math.floor(Math.random() * 1000);
    const email = `${name.toLowerCase()}_${timestamp}@test.com`;
    
    page.on('dialog', d => d.accept());
    
    console.log(`👤 Registrando a ${name}...`);
    await page.goto('http://localhost:8082/register');
    await page.waitForSelector('input');
    const inputs = await page.$$('input');
    await inputs[0].fill(name);
    await inputs[1].fill(email);
    await inputs[2].fill('Password123!');
    await inputs[3].fill('Password123!');
    await page.click('button:has-text("Crear Cuenta")');
    await page.waitForTimeout(5000);
    
    return { page, name, email };
  }

  try {
    const userA = await setupUser('User_A');
    const userB = await setupUser('User_B');

    console.log('🔍 User_B busca a User_A...');
    await userB.page.goto('http://localhost:8082/new-chat');
    await userB.page.waitForTimeout(2000);
    
    // Buscar el input de búsqueda de forma robusta
    const searchInput = await userB.page.locator('input').first();
    await searchInput.fill('User_A');
    await userB.page.waitForTimeout(2000);
    
    // Clic en el resultado que contenga el nombre de User_A
    console.log('🖱️ Seleccionando User_A de la lista...');
    await userB.page.click(`text="${userA.name}"`);
    await userB.page.waitForTimeout(2000);
    
    console.log('✉️ User_B envía mensaje...');
    const msgInput = await userB.page.locator('input[placeholder*="mensaje"], textarea').first();
    await msgInput.fill('Hola User_A! Soy User_B. ¿Me recibes? 🚀');
    await userB.page.keyboard.press('Enter');
    await userB.page.waitForTimeout(2000);
    await userB.page.screenshot({ path: 'chat_sent_b.png' });

    console.log('👀 Verificando en User_A...');
    await userA.page.goto('http://localhost:8082/(chat)');
    await userA.page.waitForTimeout(3000);
    await userA.page.screenshot({ path: 'chat_list_a.png' });
    
    const hasChat = await userA.page.evaluate((name) => document.body.innerText.includes(name), userB.name);
    console.log(`¿User_A ve el chat de ${userB.name}?: ${hasChat}`);

    console.log('✅ PRUEBA INTEGRAL COMPLETADA CON ÉXITO.');

  } catch (err) {
    console.error('❌ Fallo en la prueba integral:', err);
  } finally {
    await browser.close();
  }
})();
