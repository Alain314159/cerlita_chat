# Feature: Sistema de Temas Personalizables

## User Stories

### US-001: Tema Claro (Light Theme)
**Como** usuario
**Quiero** usar un tema claro con colores claros
**Para** tener buena visibilidad en ambientes con buena iluminación

**Criterios de Aceptación:**
- [ ] Dado que selecciono tema claro, cuando cambio el tema, entonces toda la UI usa colores claros
- [ ] Dado que estoy en tema claro, cuando abro la app, entonces se mantiene el tema claro
- [ ] Dado que estoy en tema claro, cuando modifico colores, entonces se actualiza manteniendo el estilo claro

**Constraints:**
- Colores base: Blanco (#FFFFFF), Gris claro (#F5F5F5), Azul claro (#E3F2FD)
- Texto: Oscuro (#212121) para contraste
- Debe pasar tests de contraste de accesibilidad (ratio > 4.5:1)

---

### US-002: Tema Oscuro (Dark Theme)
**Como** usuario
**Quiero** usar un tema oscuro con colores oscuros
**Para** reducir fatiga visual en ambientes con poca luz

**Criterios de Aceptación:**
- [ ] Dado que selecciono tema oscuro, cuando cambio el tema, entonces toda la UI usa colores oscuros
- [ ] Dado que estoy en tema oscuro, cuando abro la app, entonces se mantiene el tema oscuro
- [ ] Dado que estoy en tema oscuro, cuando modifico colores, entonces se actualiza manteniendo el estilo oscuro

**Constraints:**
- Colores base: Negro (#121212), Gris oscuro (#1E1E1E), Azul oscuro (#0D47A1)
- Texto: Claro (#FFFFFF) para contraste
- Debe pasar tests de contraste de accesibilidad (ratio > 4.5:1)

---

### US-003: Tema Cerdita (Pig Theme)
**Como** usuario
**Quiero** usar un tema inspirado en cerditos con colores rosados
**Para** personalizar la app con un diseño divertido y único

**Criterios de Aceptación:**
- [ ] Dado que selecciono tema cerdita, cuando cambio el tema, entonces toda la UI usa colores rosados y temática de cerditos
- [ ] Dado que estoy en tema cerdita, cuando abro la app, entonces veo iconos/elementos de cerditos
- [ ] Dado que estoy en tema cerdita, cuando modifico colores, entonces se actualiza manteniendo la temática

**Constraints:**
- Colores base: Rosa (#FFB6C1), Rosa oscuro (#FF69B4), Blanco (#FFFFFF)
- Iconos: Incluir al menos 1 ícono de cerdito visible
- Gradientes: Rosa suave a rosa fuerte
- Debe mantener contraste accesible (ratio > 4.5:1)

---

### US-004: Tema Koala
**Como** usuario
**Quiero** usar un tema inspirado en koalas con colores grises y azules
**Para** personalizar la app con un diseño tranquilo y relajante

**Criterios de Aceptación:**
- [ ] Dado que selecciono tema koala, cuando cambio el tema, entonces toda la UI usa colores grises y azules
- [ ] Dado que estoy en tema koala, cuando abro la app, entonces veo elementos de koalas
- [ ] Dado que estoy en tema koala, cuando modifico colores, entonces se actualiza manteniendo la temática

**Constraints:**
- Colores base: Gris (#B0BEC5), Azul grisáceo (#546E7A), Verde eucalipto (#4CAF50)
- Iconos: Incluir al menos 1 ícono de koala visible
- Gradientes: Gris a azul suave
- Debe mantener contraste accesible (ratio > 4.5:1)

---

### US-005: Tema Mixto (Koala + Cerdita)
**Como** usuario
**Quiero** usar un tema que combine elementos de koala y cerdita
**Para** tener lo mejor de ambos temas en un diseño único

**Criterios de Aceptación:**
- [ ] Dado que selecciono tema mixto, cuando cambio el tema, entonces toda la UI combina colores de koala y cerdita
- [ ] Dado que estoy en tema mixto, cuando abro la app, entonces veo elementos de ambos temas equilibrados
- [ ] Dado que estoy en tema mixto, cuando modifico colores, entonces se actualiza manteniendo el balance

**Constraints:**
- Colores base: Combinación de rosa (#FFB6C1) y gris-azul (#B0BEC5)
- Iconos: Alternar entre cerdito y koala en diferentes secciones
- Gradientes: Rosa a gris-azul
- Debe mantener contraste accesible (ratio > 4.5:1)

---

### US-006: Personalización de Colores
**Como** usuario
**Quiero** modificar los colores de cualquier tema
**Para** adaptar la app a mis preferencias personales

**Criterios de Aceptación:**
- [ ] Dado que estoy en cualquier tema, cuando abro personalización, entonces puedo cambiar colores primarios, secundarios y de fondo
- [ ] Dado que modifico colores, cuando guardo, entonces toda la UI se actualiza inmediatamente
- [ ] Dado que modifico colores, cuando cierro y abro la app, entonces se mantienen mis colores personalizados

**Constraints:**
- Selector de colores: Color picker con vista previa en tiempo real
- Mínimo 3 colores personalizables: primario, secundario, fondo
- Máximo 10 colores personalizables
- Debe validar contraste automáticamente
- Opción de restablecer a colores del tema original

---

### US-007: Tema Personalizado desde Imagen
**Como** usuario
**Quiero** crear un tema basado en una imagen que yo suba
**Para** tener una app que combine con mis fotos o arte favorito

**Criterios de Aceptación:**
- [ ] Dado que subo una imagen, cuando genero el tema, entonces la app extrae colores dominantes de la imagen
- [ ] Dado que subo una imagen, cuando genero el tema, entonces puedo previsualizar cómo queda la UI
- [ ] Dado que subo una imagen, cuando guardo el tema, entonces se aplica a toda la app
- [ ] Dado que tengo un tema de imagen, cuando cierro y abro la app, entonces se mantiene el tema

**Constraints:**
- Formatos soportados: JPG, PNG, WebP
- Tamaño máximo: 5MB
- Extracción de colores: Usar algoritmo para obtener 5-10 colores dominantes
- Vista previa: Mostrar cómo se ven los colores en la UI antes de guardar
- Almacenamiento: Guardar imagen y colores en base de datos local
- Debe validar contraste de colores extraídos

---

## Casos de Error Conocidos

### ERR-001: Imagen no válida para tema personalizado
**Escenario:** Usuario sube imagen corrupta o formato no soportado
**Comportamiento esperado:**
- Mostrar mensaje de error claro
- Sugerir formatos válidos (JPG, PNG, WebP)
- No aplicar tema inválido

### ERR-002: Colores con bajo contraste
**Escenario:** Colores seleccionados no pasan test de accesibilidad
**Comportamiento esperado:**
- Mostrar advertencia de contraste
- Sugerir colores alternativos
- Permitir guardar pero con advertencia

### ERR-003: Imagen muy grande
**Escenario:** Usuario sube imagen > 5MB
**Comportamiento esperado:**
- Mostrar error de tamaño máximo
- Sugerir comprimir imagen
- No procesar imagen

---

## Métricas de Calidad

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Tiempo de cambio de tema** | < 100ms | Medir desde selección hasta UI actualizada |
| **Extracción de colores de imagen** | < 2 segundos | Tiempo desde subir imagen hasta mostrar colores |
| **Contraste de colores** | > 4.5:1 | Usar fórmula WCAG 2.1 |
| **Persistencia de tema** | 100% | Verificar que tema se mantiene tras reiniciar app |

---

## Historial de Cambios

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| 0.1.0 | 2026-03-24 | Specs iniciales |

---

**Última Actualización:** 2026-03-24
**Estado:** ⏳ Pendiente de implementación
**Próxima Revisión:** 2026-03-31
