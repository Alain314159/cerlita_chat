import * as Sentry from 'sentry-expo';

/**
 * Wrapper para ejecutar acciones de Store con reporte automático a Sentry.
 * Ideal para 2026: Diagnóstico proactivo.
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
    
    Sentry.Native.captureException(error, {
      tags: { action: actionName },
      extra: context,
    });
    
    throw error;
  }
}
