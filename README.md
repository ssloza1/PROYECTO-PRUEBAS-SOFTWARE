# Sistema de Inventario y Ventas

Proyecto desarrollado para la materia de Pruebas de Software. El sistema permite gestionar productos, clientes, ventas e inventario con una API REST construida en Node.js y Express, conectada a PostgreSQL mediante Supabase.

## Descripción

La aplicación incluye un backend con arquitectura por capas, validaciones de negocio, manejo de errores centralizado y pruebas automatizadas con Jest y Supertest. También cuenta con una interfaz web ligera para consultar y operar el sistema desde el navegador.

## Funcionalidades

- Registro y consulta de productos
- Control de stock mínimo y nivel de inventario
- Gestión de clientes
- Registro de ventas con validación de stock
- Anulación de ventas con reposición automática de inventario
- Dashboard con métricas básicas del sistema
- API REST documentada por rutas y pruebas automatizadas

## Tecnologías

- Node.js
- Express.js
- PostgreSQL
- Supabase
- Jest
- Supertest
- HTML, CSS y JavaScript vanilla

## Estructura del proyecto

```text
PROYECTO-PRUEBAS-SOFTWARE/
├── README.md
├── package.json
├── eslint.config.js
├── sonar-project.properties
├── database/
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── docs/
│   ├── matriz-casos-de-prueba.md
│   ├── matriz-pruebas-vv.md
│   ├── modelo-er.md
│   └── reglas-negocio.md
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
│   ├── api/
│   ├── helpers/
│   ├── integration/
│   ├── mocks/
│   └── unit/
└── SistemaVentas/
    └── package.json
```

## Requisitos

- Node.js 20 o superior
- npm
- Acceso a una base de datos PostgreSQL o Supabase
- Variables de entorno configuradas en el archivo .env

## Instalación

Desde la raíz del proyecto:

```bash
npm install
```

Si vas a trabajar desde la carpeta `SistemaVentas`:

```bash
cd SistemaVentas
npm install
```

## Ejecución

Modo producción:

```bash
npm start
```

Modo desarrollo:

```bash
npm run dev
```

La aplicación queda disponible en:

- http://localhost:3000
- http://localhost:3000/api/health

## Rutas principales de la API

- GET /api/health
- GET /api/productos
- GET /api/productos/:id
- POST /api/productos
- PUT /api/productos/:id
- DELETE /api/productos/:id
- GET /api/clientes
- GET /api/clientes/:id
- POST /api/clientes
- PUT /api/clientes/:id
- DELETE /api/clientes/:id
- GET /api/ventas
- GET /api/ventas/:id
- POST /api/ventas
- DELETE /api/ventas/:id
- GET /api/catalogos
- GET /api/dashboard

## Pruebas

Ejecutar todas las pruebas unitarias y de API:

```bash
npm test
```

Pruebas unitarias:

```bash
npm run test:unit
```

Pruebas de API:

```bash
npm run test:api
```

Pruebas de integración:

```bash
npm run test:integration
```

Cobertura:

```bash
npm run test:coverage
```

## Documentación

La documentación del proyecto se encuentra en la carpeta `docs` y cubre:

- matriz de casos de prueba
- reglas de negocio
- modelo entidad-relación
- resultados de validación de software

## Consideraciones

El proyecto está orientado a la validación de requisitos funcionales, reglas de negocio y comportamiento de la API bajo escenarios normales y de error. La implementación y las pruebas están diseñadas para demostrar buenas prácticas en pruebas de software y desarrollo backend con Node.js.

## Licencia

ISC