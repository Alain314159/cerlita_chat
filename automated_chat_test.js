const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando Super-Prueba de Cerlita Chat (Dos Usuarios)...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  
  async function registerUser(browser, name, email) {
    const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
    const page = await context.newPage();
    
    page.on('dialog', async dialog => {
      console.log(`[${name} DIALOG] ${dialog.message()}`);
      await dialog.accept();
    });

    console.log(`🔗 Navegando directamente a /register para ${name}...`);
    await page.goto('http://localhost:8082/register');
    await page.waitForSelector('input');

    const inputs = await page.$$('input');
    if (inputs.length >= 4) {
      await inputs[0].fill(name);
      await inputs[1].fill(email);
      await inputs[2].fill('Password123!');
      await inputs[3].fill('Password123!');
    }
    
    await page.click('button:has-text("Crear Cuenta"), [role="button"]:has-text("Crear Cuenta")');
    
    console.log(`⏳ Esperando Dashboard para ${name}...`);
    await page.waitForTimeout(5000);
    if (page.url().includes('register')) {
      await page.goto('http://localhost:8082/(chat)');
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `reg_${name}_dashboard.png` });
    
    return { page, context };
  }

  const timestamp = Date.now();
  const userA_data = { name: `Alain_A_${timestamp}`, email: `alain_a_${timestamp}@test.com` };
  const userB_data = { name: `Alain_B_${timestamp}`, email: `alain_b_${timestamp}@test.com` };

  try {
    console.log('👤 Registrando Usuario A...');
    const userA = await registerUser(browser, userA_data.name, userA_data.email);

    console.log('👤 Registrando Usuario B...');
    const userB = await registerUser(browser, userB_data.name, userB_data.email);

    console.log('💬 Iniciando conversación...');
    
    // Usuario B busca a Usuario A
    console.log('🔍 Usuario B buscando a Usuario A...');
    await userB.page.goto('http://localhost:8082/new-chat'); // Ruta relativa si /(chat)/ no es necesaria en la URL
    await userB.page.waitForTimeout(3000);
    
    const searchInput = await userB.page.waitForSelector('input');
    await searchInput.fill(userA_data.name);
    
    await userB.page.waitForTimeout(3000); // Esperar a que Supabase devuelva resultados
    await userB.page.screenshot({ path: 'chat_01_search_results.png' });
    
    // Clic en el resultado de búsqueda
    console.log('🖱️ Clic en el usuario encontrado...');
    await userB.page.click(`text="${userA_data.name}"`);
    
    await userB.page.waitForTimeout(3000);
    await userB.page.screenshot({ path: 'chat_02_inside_room.png' });

    console.log('✉️ Usuario B envía mensaje...');
    // El input de mensaje suele ser un input o textarea
    const inputMsg = await userB.page.waitForSelector('input[placeholder*="mensaje"], textarea, [role="textbox"]');
    await inputMsg.fill('¡Hola Alain! Prueba de chat en tiempo real 💕');
    await userB.page.keyboard.press('Enter');
    
    await userB.page.waitForTimeout(2000);
    await userB.page.screenshot({ path: 'chat_03_sent.png' });

    console.log('👀 Verificando en Usuario A...');
    await userA.page.goto('http://localhost:8082/(chat)');
    await userA.page.waitForTimeout(4000); // Dar tiempo a que Realtime actualice la lista
    await userA.page.screenshot({ path: 'chat_04_list_received.png' });
    
    console.log('✅ Super-Prueba completada. Revisa las capturas reg_*.png y chat_*.png');

  } catch (err) {
    console.error('❌ Error fatal:', err);
    // Tomar captura del error para ver qué pasó
    try {
      const contexts = browser.contexts();
      const activePage = contexts[0]?.pages()[0];
      if (activePage) await activePage.screenshot({ path: 'fatal_error_visual.png' });
    } catch(err_scr) {
      console.log('No se pudo tomar captura del error');
    }
  } finally {
    await browser.close();
  }
})();
