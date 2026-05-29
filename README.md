# MIPS Instruction Decoder & Encoder

Este proyecto es una herramienta y librería en **TypeScript** diseñada para realizar el flujo completo de **análisis (parsing), codificación (encoding), decodificación (decoding) y formateo** de instrucciones de la arquitectura **MIPS**. 

Soporta conjuntos de instrucciones tanto **MIPS I (Legacy)** como **MIPS R6**.

---

##  Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de iniciar:
* [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
* [pnpm](https://pnpm.io/) (Gestor de paquetes utilizado en este proyecto)

---

##  Instalación de Dependencias

Para instalar todas las dependencias necesarias del proyecto, abre tu terminal en la carpeta raíz del proyecto y ejecuta:

```bash
pnpm install
```

---

##  Cómo Ejecutar las Pruebas (Tests)

Este proyecto utiliza **Vitest** como framework de pruebas. A continuación tienes los comandos para los diferentes modos de ejecución:

### 1. Ejecutar todas las pruebas una vez (CI/CD / Verificación rápida)
```bash
pnpm test run
```

### 2. Ejecutar pruebas en modo observador (Watch Mode)
Las pruebas se ejecutan automáticamente cada vez que editas o guardas un archivo:
```bash
pnpm test
```

### 3. Ejecutar un archivo de prueba específico
Si estás trabajando en una parte específica y quieres probar solo ese archivo (por ejemplo, `e2e.test.ts`):
```bash
pnpm test test/e2e.test.ts --run
```

### 4. Generar reporte de cobertura de código (Coverage)
Para analizar qué partes del código están cubiertas por las pruebas unitarias:
```bash
pnpm exec vitest run --coverage
```

---

##  Cómo Ejecutar y Compilar el Código

### Opción A: Ejecución directa en desarrollo (Sin compilar manualmente)
Puedes correr directamente cualquier script de TypeScript usando `tsx` de manera rápida:

```bash
npx tsx src/main.ts
```

### Opción B: Proceso de compilación y ejecución estándar (Producción)

1. **Compilar el proyecto** a JavaScript nativo:
   ```bash
   pnpm exec tsc
   ```
   *(Esto generará los archivos resultantes en el directorio `dist/`)*

2. **Ejecutar el archivo compilado**:
   ```bash
   node dist/main.js
   ```

---

## 📁 Estructura Principal del Proyecto

El proyecto está organizado de la siguiente manera:

* 📂 **`src/`** — Código fuente principal.
  * 📂 `src/constants/` — Constantes de encondings para MIPS R6 y Legacy.
  * 📂 `src/services/` — Parsers de código ensamblador y gestores de encoding/decoding.
  * 📂 `src/utils/` — Funciones de ayuda (manipulación de bits, registros, formato de operandos).
  * 📄 `src/main.ts` — Punto de entrada de la aplicación.
* 📂 **`test/`** — Conjunto completo de pruebas unitarias, de integración, rendimiento, estrés y E2E.
* 📄 `tsconfig.json` — Configuración del compilador TypeScript.
* 📄 `vitest.config.ts` — Configuración del framework Vitest.
