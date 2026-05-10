/**
 * Wrapper para ejecutar acciones de Store con reporte proactivo.
 * Maestro 2026: Diagnóstico de alta señal.
 */
export async function safeStoreAction<T>(
  actionName: string,
  action: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    console.error(`[StoreAction Error: ${actionName}]`, error);
    
    // En lugar de Sentry (que añade peso innecesario al MVP), 
    // usamos un sistema de logging estructurado por consola.
    if (context) {
      console.log(`[Context: ${actionName}]`, JSON.stringify(context, null, 2));
    }
    
    throw error;
  }
}
