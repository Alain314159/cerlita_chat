const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando Tour Automatizado por Cerlita Chat...');
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/tmp/playwright-browsers';

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } }); // Simular móvil
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `user_${timestamp}@test.com`;
  const testName = `User_${timestamp}`;

  try {
    await page.goto('http://localhost:8082');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tour_01_login.png' });

    console.log('➡️ Yendo a Registro...');
    await page.click('text="Crear Cuenta"');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tour_02_register_form.png' });

    console.log(`✍️ Registrando usuario: ${testEmail}`);
    await page.waitForSelector('input');
    const inputs = await page.$$('input');
    await inputs[0].fill(testName);
    await inputs[1].fill(testEmail);
    await inputs[2].fill('Password123!');
    await inputs[3].fill('Password123!');
    
    await page.screenshot({ path: 'tour_03_form_filled.png' });
    await page.click('button:has-text("Crear Cuenta")');

    console.log('⏳ Esperando redirección al Dashboard...');
    await page.waitForTimeout(5000); // Esperar carga de Supabase y redirección
    await page.screenshot({ path: 'tour_04_dashboard.png' });

    // --- NAVEGACIÓN ---
    console.log('🧭 Explorando pestañas...');
    
    // Buscar iconos de navegación (normalmente están abajo)
    const tabs = ['Solicitudes', 'Ajustes', 'Chats'];
    for (const tab of tabs) {
      console.log(`   - Clic en ${tab}`);
      try {
        await page.click(`text="${tab}"`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `tour_05_tab_${tab.toLowerCase()}.png` });
      } catch (e) {
        console.log(`   ⚠️ No se pudo hacer clic en pestaña ${tab}`);
      }
    }

    // --- PRUEBA DE AJUSTES ---
    console.log('⚙️ Entrando a Perfil...');
    await page.click('text="Editar Perfil"');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tour_06_profile_edit.png' });
    
    console.log('✅ Tour finalizado con éxito.');

  } catch (err) {
    console.error('❌ Error durante el tour:', err);
    await page.screenshot({ path: 'tour_error.png' });
  } finally {
    await browser.close();
  }
})();
