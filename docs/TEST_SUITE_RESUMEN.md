# Resumen del Test Suite (CL-06)

## Visión General

Se implementó un test suite completo usando **Vitest** + **@testing-library/react** para el proyecto Next.js 16 + React 19. El objetivo era demostrar capacidad de testing sin buscar 100% de cobertura, enfocándose en 15-20 tests significativos.

**Resultado:** ✅ **35 tests pasando** en 4 archivos de test

---

## Infraestructura de Testing

### Dependencias Instaladas

```json
{
  "vitest": "^latest",
  "@vitejs/plugin-react": "^latest",
  "@testing-library/react": "^latest",
  "@testing-library/jest-dom": "^latest",
  "jsdom": "^latest"
}
```

### Configuración (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",           // Simula el DOM del navegador
        globals: true,                  // describe, it, expect globales
        setupFiles: ["./__tests__/setup.ts"],
        include: ["__tests__/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.d.ts", "src/i18n/**"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),  // Alias @/ → src/
        },
    },
});
```

**Características clave:**
- **jsdom**: Entorno de navegador simulado para renderizar componentes React
- **globals: true**: No necesitas importar `describe`, `it`, `expect` en cada test
- **setupFiles**: Ejecuta `__tests__/setup.ts` antes de todos los tests
- **Alias `@/`**: Resuelve igual que en el código de producción

### Setup Global (`__tests__/setup.ts`)

```typescript
import "@testing-library/jest-dom/vitest";

// Polyfill IntersectionObserver para framer-motion
class MockIntersectionObserver implements IntersectionObserver {
    // ... implementación mock
}

globalThis.IntersectionObserver = MockIntersectionObserver;
```

**Por qué es necesario:**
- `@testing-library/jest-dom/vitest`: Añade matchers como `.toBeInTheDocument()`, `.toHaveTextContent()`
- **IntersectionObserver polyfill**: jsdom no lo implementa nativamente, pero `framer-motion` lo usa para `whileInView`. El mock simula que todos los elementos están visibles inmediatamente.

### Scripts NPM

```json
{
  "test": "vitest run",              // Ejecuta todos los tests una vez
  "test:watch": "vitest",            // Modo watch (re-ejecuta al cambiar archivos)
  "test:coverage": "vitest run --coverage"  // Con reporte de cobertura
}
```

---

## Archivos de Test

### 1. `narrative-primitives.test.tsx` (20 tests)

**Qué testea:** Componentes compartidos de narrativas educativas (Section, SectionLabel, Heading, Lead, P, Highlight, Callout, FormulaBlock)

**Estrategia:**
- **Renderizado básico**: Verifica que cada componente renderiza sin crashear
- **Props variants**: Testea las 4 variantes de accent (emerald, amber, rose, violet)
- **Condicionales**: Verifica que elementos opcionales (tooltip, title) aparecen/desaparecen correctamente

**Ejemplo de test:**

```typescript
describe("Highlight", () => {
    it("renders tooltip when provided", () => {
        render(
            <Highlight color="rose" tooltip="Extra info">
                with tooltip
            </Highlight>
        );
        expect(screen.getByText("with tooltip")).toBeInTheDocument();
        expect(screen.getByRole("tooltip")).toHaveTextContent("Extra info");
    });

    it("does not render tooltip element when not provided", () => {
        render(<Highlight color="emerald">no tooltip</Highlight>);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
});
```

**Aprendizajes:**
- `screen.getByText()` → Encuentra elemento por texto visible (lanza error si no existe)
- `screen.queryByRole()` → Busca por rol ARIA (retorna `null` si no existe, no lanza error)
- `.toBeInTheDocument()` → Matcher de jest-dom que verifica presencia en el DOM

---

### 2. `lmLabClient.test.ts` (5 tests)

**Qué testea:** Lógica de fetch del cliente API (retry, timeout, manejo de errores)

**Desafío:** `lmLabClient.ts` no exporta las funciones internas (`requestRaw`, `withRetry`, `LmLabError`), solo las funciones públicas (`visualizeBigram`, `generateBigram`, etc.). Solución: **testear el comportamiento observable** mockeando `globalThis.fetch`.

**Estrategia:**
- Mock `fetch` con `vi.fn()` para controlar respuestas
- Verificar que el retry funciona (network error → 2 llamadas a fetch)
- Verificar que errores no-retryables NO se reintentan (422 → 1 llamada)

**Ejemplo de test:**

```typescript
it("network error (status 0) triggers retry — fetch called twice", async () => {
    const mockData = { generated_text: "hello world" };
    globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))  // 1er intento falla
        .mockResolvedValueOnce({                                   // 2do intento OK
            ok: true,
            json: () => Promise.resolve(mockData),
        });

    const { generateBigram } = await import("@/lib/lmLabClient");
    const result = await generateBigram("h", 50, 1.0);

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);  // ✅ Retry funcionó
});
```

**Aprendizajes:**
- `vi.fn()` → Crea una función mock de Vitest
- `.mockRejectedValueOnce()` → Primera llamada lanza error
- `.mockResolvedValueOnce()` → Segunda llamada retorna promesa resuelta
- `await import()` → Importación dinámica (necesaria porque el módulo lee `process.env` al importarse)

**Por qué NO usar fake timers aquí:**
- `lmLabClient` usa `setTimeout` real dentro de `AbortController`
- Mezclar fake timers con AbortController causa race conditions
- Solución: Usar timers reales y mockear fetch para que resuelva inmediatamente

---

### 3. `useBackendHealth.test.ts` (5 tests)

**Qué testea:** Hook que verifica si el backend está online/offline

**Desafío:** El hook usa `useEffect` con intervalos, timers, y fetch. Necesitamos controlar el tiempo.

**Estrategia:**
- `renderHook()` de @testing-library/react para renderizar hooks sin componente
- `vi.useFakeTimers()` para controlar `setTimeout`/`setInterval`
- `act()` para envolver avances de tiempo (evita warnings de React)
- `waitFor()` para esperar cambios asíncronos de estado

**Ejemplo de test:**

```typescript
it("returns 'offline' when fetch fails and timeout elapses", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useBackendHealth());

    // Avanzar 56 segundos (HEALTH_TIMEOUT_MS = 45s + margen)
    await act(async () => {
        await vi.advanceTimersByTimeAsync(56000);
    });

    expect(result.current.status).toBe("offline");
});
```

**Aprendizajes:**
- `renderHook()` → Renderiza un hook en un componente test wrapper
- `result.current` → Accede al valor retornado por el hook
- `vi.useFakeTimers()` → Reemplaza setTimeout/setInterval con versiones controlables
- `vi.advanceTimersByTimeAsync()` → Avanza el tiempo simulado
- `act()` → Envuelve actualizaciones de estado para evitar warnings

**Patrón común:**
```typescript
await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);  // Avanzar 2 segundos
});
// Ahora puedes verificar el nuevo estado
expect(result.current.showBanner).toBe(true);
```

---

### 4. `ErrorBoundary.test.tsx` (5 tests)

**Qué testea:** Componente de clase que captura errores de renderizado

**Desafío:** Necesitamos un componente que lance errores de forma controlada

**Estrategia:**
- Crear componente `ThrowingComponent` que lanza error condicionalmente
- Suprimir `console.error` para evitar ruido en los tests (React logea errores capturados)
- Testear el botón "Retry" que resetea el estado de error

**Ejemplo de test:**

```typescript
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error("Test explosion");
    return <div>All good</div>;
}

it("retry button resets error state and re-renders children", () => {
    let shouldThrow = true;

    function ConditionalThrower() {
        if (shouldThrow) throw new Error("Boom");
        return <div>Recovered</div>;
    }

    render(
        <ErrorBoundary>
            <ConditionalThrower />
        </ErrorBoundary>
    );

    expect(screen.getByText("Retry")).toBeInTheDocument();  // Fallback visible

    shouldThrow = false;  // Dejar de lanzar error
    fireEvent.click(screen.getByText("Retry"));  // Click en retry

    expect(screen.getByText("Recovered")).toBeInTheDocument();  // ✅ Recuperado
});
```

**Aprendizajes:**
- `fireEvent.click()` → Simula click de usuario
- **Suprimir console.error**: React logea errores capturados por ErrorBoundary. Para evitar ruido:
  ```typescript
  beforeEach(() => {
      console.error = vi.fn();  // Mock console.error
  });
  afterEach(() => {
      console.error = originalConsoleError;  // Restaurar
  });
  ```

---

## Comandos de Ejecución

### Ejecutar todos los tests
```bash
npm test
```

**Salida:**
```
Test Files  4 passed (4)
     Tests  35 passed (35)
  Duration  4.78s
```

### Modo watch (desarrollo)
```bash
npm run test:watch
```
- Re-ejecuta tests al cambiar archivos
- Útil durante desarrollo

### Con cobertura
```bash
npm run test:coverage
```
- Genera reporte de cobertura en `coverage/`
- Muestra % de líneas/funciones/branches cubiertos

---

## Patrones y Best Practices

### 1. Organización de Tests

```typescript
describe("ComponentName", () => {
    describe("feature A", () => {
        it("does X when Y", () => {
            // Arrange (preparar)
            const props = { ... };
            
            // Act (ejecutar)
            render(<Component {...props} />);
            
            // Assert (verificar)
            expect(screen.getByText("...")).toBeInTheDocument();
        });
    });
});
```

**Patrón AAA (Arrange-Act-Assert):**
1. **Arrange**: Preparar datos, mocks, estado inicial
2. **Act**: Ejecutar la acción (render, click, llamada a función)
3. **Assert**: Verificar el resultado esperado

### 2. Queries de Testing Library

| Query | Cuándo usar | Lanza error si no existe |
|-------|-------------|-------------------------|
| `getByText()` | Elemento debe existir | ✅ Sí |
| `queryByText()` | Verificar que NO existe | ❌ No (retorna null) |
| `findByText()` | Elemento aparece asíncronamente | ✅ Sí (espera hasta timeout) |

**Ejemplo:**
```typescript
// ✅ Correcto: Verificar que existe
expect(screen.getByText("Submit")).toBeInTheDocument();

// ✅ Correcto: Verificar que NO existe
expect(screen.queryByText("Error")).not.toBeInTheDocument();

// ❌ Incorrecto: getBy lanzará error antes de llegar al expect
expect(screen.getByText("Error")).not.toBeInTheDocument();
```

### 3. Mocking con Vitest

```typescript
// Mock de función
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
expect(mockFn()).toBe(42);

// Mock de módulo
vi.mock("@/lib/api", () => ({
    fetchData: vi.fn().mockResolvedValue({ data: "test" }),
}));

// Mock de globalThis
globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ result: "ok" }),
});
```

### 4. Testing de Hooks

```typescript
import { renderHook, waitFor } from "@testing-library/react";

it("hook returns expected value", async () => {
    const { result } = renderHook(() => useMyHook());
    
    // Estado inicial
    expect(result.current.loading).toBe(true);
    
    // Esperar cambio asíncrono
    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });
});
```

### 5. Testing de Componentes con Framer Motion

**Problema:** `framer-motion` usa `IntersectionObserver` (no disponible en jsdom)

**Solución:** Polyfill en `setup.ts`:
```typescript
class MockIntersectionObserver implements IntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {
        // Simular que todo está visible inmediatamente
        setTimeout(() => {
            this.callback([{ isIntersecting: true }], this);
        }, 0);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.IntersectionObserver = MockIntersectionObserver;
```

---

## Métricas del Test Suite

| Métrica | Valor |
|---------|-------|
| **Test files** | 4 |
| **Total tests** | 35 |
| **Pass rate** | 100% ✅ |
| **Duración** | ~4.8s |
| **Componentes testeados** | 8 (primitives) + 1 (ErrorBoundary) |
| **Hooks testeados** | 1 (useBackendHealth) |
| **Módulos testeados** | 1 (lmLabClient) |

---

## Cobertura de Testing

### Componentes UI
- ✅ Primitivas de narrativa (Section, Heading, Lead, P, Highlight, Callout, etc.)
- ✅ ErrorBoundary (captura de errores + retry)

### Lógica de Negocio
- ✅ Cliente API (fetch, retry, timeout, manejo de errores)
- ✅ Health check del backend (online/offline/connecting)

### Casos Edge Testeados
- ✅ Props opcionales (tooltip, title)
- ✅ Variantes de color/accent
- ✅ Retry en network errors
- ✅ NO retry en errores 4xx
- ✅ Timeout handling
- ✅ Estado de error + recuperación

---

## Próximos Pasos (Futuro)

### Tests Adicionales Recomendados
1. **Integración**: Tests end-to-end con Playwright
2. **Visualizadores**: Tests de componentes SVG complejos
3. **Hooks de estado**: `useMLPGrid`, `useNgramVisualization`
4. **i18n**: Verificar traducciones EN/ES

### Mejoras de Infraestructura
1. **Coverage threshold**: Configurar mínimo de cobertura (ej. 70%)
2. **CI/CD**: Ejecutar tests en GitHub Actions
3. **Visual regression**: Chromatic o Percy para detectar cambios visuales
4. **Performance**: Tests de rendering performance con React DevTools Profiler

---

## Conclusión

El test suite implementado demuestra:
- ✅ **Capacidad técnica**: Configuración profesional de Vitest + Testing Library
- ✅ **Cobertura estratégica**: Tests enfocados en lógica crítica (API, error handling, UI primitives)
- ✅ **Mantenibilidad**: Tests claros, bien organizados, con buenos nombres
- ✅ **Automatización**: Scripts NPM listos para CI/CD

**35 tests pasando** en 4 archivos, cubriendo componentes React, hooks, y lógica de API. El objetivo de "demostrar capacidad de testing" se cumplió exitosamente sin buscar 100% de cobertura.
