# Sistema de Inventario y Ventas - Pruebas de Software

Proyecto desarrollado para la materia de **Pruebas de Software**. Implementa un sistema completo de control de inventario, punto de venta (POS) y facturación con arquitectura desacoplada, conectado a una base de datos PostgreSQL alojada en **Supabase Cloud**, y respaldado por una suite integral de **72 pruebas unitarias y de integración** aplicando técnicas de caja negra y caja blanca.

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js v24+, Express.js
- **Base de Datos:** PostgreSQL 17 (alojado en Supabase Cloud con conexión Pooler IPv4)
- **Cliente DB:** `pg` (Pool de conexiones con transacciones ACID) y `@supabase/supabase-js`
- **Suite de Pruebas:** Jest, Supertest
- **Frontend:** HTML5 Semántico, Vanilla CSS3 (diseño moderno con tema oscuro, glassmorphism y microanimaciones), Vanilla JavaScript reactivo

---

## 🏗️ Arquitectura del Proyecto

El sistema aplica el patrón de diseño por capas **Controller-Service-Repository**, garantizando una alta testabilidad e independencia del motor de base de datos:

```
PROYECTO-PRUEBAS-SOFTWARE/
├── README.md
├── .gitignore
└── SistemaVentas/
    ├── .env                         # Credenciales y conexión a Supabase
    ├── .env.example                 # Plantilla de variables de entorno
    ├── package.json                 # Scripts de ejecución y pruebas
    ├── database/
    │   ├── 01_schema.sql            # Definición de tablas, llaves e índices
    │   └── 02_seed.sql              # Datos iniciales de prueba
    ├── docs/
    │   ├── modelo-er.md             # Modelo Entidad-Relación
    │   ├── reglas-negocio.md        # Especificación formal de reglas de negocio
    │   └── matriz-casos-de-prueba.md # Matriz con los 72 casos de prueba
    ├── public/                      # Frontend Web Dashboard interactivo
    │   ├── index.html
    │   ├── css/style.css
    │   └── js/app.js
    ├── src/
    │   ├── app.js                   # Configuración de Express y middlewares
    │   ├── server.js                # Arranque del servidor HTTP (Puerto 3000)
    │   ├── config/
    │   │   ├── db.js                # Conexión PostgreSQL Pool a Supabase
    │   │   └── supabase.js          # Cliente Supabase SDK
    │   ├── controllers/             # Manejadores de solicitudes HTTP
    │   ├── services/                # Lógica de negocio pura (testable)
    │   ├── repositories/            # Acceso a datos y consultas SQL
    │   ├── middlewares/             # Manejo centralizado de errores
    │   ├── routes/                  # Definición de rutas REST
    │   └── utils/                   # Funciones puras (cálculos, validadores)
    └── tests/
        ├── mocks/                   # Mocks de base de datos y repositorios
        ├── unit/                    # Pruebas unitarias (cálculos, reglas, servicios)
        │   ├── calculos.test.js
        │   ├── validadores.test.js
        │   ├── productoService.test.js
        │   └── ventaService.test.js
        └── integration/             # Pruebas de integración con Supertest y DB
            └── api.test.js
```

---

## ⚡ Conexión a la Base de Datos (Supabase)

El sistema se conecta a la instancia de Supabase mediante el **Transaction/Session Pooler en IPv4** (`us-east-1`):

- **Host:** `aws-0-us-east-1.pooler.supabase.com`
- **Puerto:** `5432`
- **Base de Datos:** `postgres`
- **Usuario:** `postgres.kmahrxgfqplzggsjkwwo`
- **SSL:** Requerido (`rejectUnauthorized: false`)

El archivo `.env` ya se encuentra configurado en `SistemaVentas/.env`.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio y entrar al proyecto:
```bash
git clone https://github.com/ssloza1/PROYECTO-PRUEBAS-SOFTWARE.git
cd PROYECTO-PRUEBAS-SOFTWARE/SistemaVentas
```

### 2. Instalar dependencias:
```bash
npm install
```

### 3. Iniciar el servidor:
```bash
# Modo producción
npm start

# Modo desarrollo con recarga automática
npm run dev
```

El servidor estará disponible en:
- **Dashboard Web interactivo:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🧪 Ejecución de Pruebas de Software

El proyecto cuenta con una suite completa de **72 casos de prueba** diseñados con técnicas de **Partición de Equivalencia (EP)**, **Análisis de Valores Límite (BVA)** y **Pruebas de Transacciones ACID**:

```bash
# Ejecutar todas las pruebas (Unitarias e Integración)
npm test

# Ejecutar únicamente las pruebas unitarias (rápidas con mocks)
npm run test:unit

# Ejecutar únicamente las pruebas de integración contra la API y base de datos
npm run test:integration

# Generar reporte de cobertura de código
npm run test:coverage
```

### Técnicas de Prueba Documentadas
- **Análisis de Valores Límite (BVA):** Cantidades mínimas (1), precio cero ($0.00), fronteras de stock al vender (stock disponible = 5; vender 5 es válido; vender 6 lanza error de stock insuficiente).
- **Partición de Equivalencia (EP):** Niveles de stock (`AGOTADO`, `CRITICO`, `NORMAL`), estado de cliente (activo/inactivo), validación de cédulas de 10 dígitos (algoritmo módulo 10).
- **Transacciones Atómicas:** Confirmación atómica (`COMMIT`) o reversión (`ROLLBACK`) ante fallos al descontar inventario, y reposición automática de stock al anular ventas.

Consulte la matriz completa de pruebas en [docs/matriz-casos-de-prueba.md](file:///c:/Users/Det-Pc/OneDrive/Escritorio/PROYECTO-PRUEBAS-SOFTWARE/SistemaVentas/docs/matriz-casos-de-prueba.md).