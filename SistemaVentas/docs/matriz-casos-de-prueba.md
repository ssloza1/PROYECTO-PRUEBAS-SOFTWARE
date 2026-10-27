# Matriz y Especificación de Casos de Prueba (Software Testing)

**Proyecto:** Sistema de Inventario y Ventas  
**Materia:** Pruebas de Software  
**Framework de Pruebas:** Jest + Supertest  
**Base de Datos:** PostgreSQL en Supabase Cloud  
**Total de Casos de Prueba Implementados:** 72  

---

## 1. Técnicas de Diseño de Pruebas Aplicadas

### 1.1 Partición de Equivalencia (Equivalence Partitioning - EP)
Se dividió el dominio de entrada en clases de datos válidos e inválidos:
- **Estados de Stock:**
  - Clase Válida 1: `AGOTADO` ($stock \le 0$)
  - Clase Válida 2: `CRITICO` ($0 < stock \le stock\_minimo$)
  - Clase Válida 3: `NORMAL` ($stock > stock\_minimo$)
- **Estado de Clientes y Proveedores:**
  - Activo: permitido para operar y facturar.
  - Inactivo: bloqueado por regla de negocio para compras.
- **Identificación de Clientes (Cédula Ecuatoriana):**
  - Clase Válida: 10 dígitos numéricos con algoritmo módulo 10 correcto y provincia válida (01 a 24).
  - Clase Inválida: menos de 10 dígitos, más de 10 dígitos, provincia inexistente (> 24), o dígito verificador adulterado.

### 1.2 Análisis de Valores Límite (Boundary Value Analysis - BVA)
Se concentraron pruebas en los extremos de los rangos de entrada:
- **Límite de Stock al Vender:**
  - Caso Frontera $stock - 1$: suficiente.
  - Caso Frontera $stock == cantidad$: suficiente (stock final exacto en 0).
  - Caso Frontera $stock + 1$: **insuficiente** (dispara excepción).
- **Límites de Precios y Cantidades:**
  - Cantidad $0$: frontera inválida (entero positivo requerido).
  - Cantidad $1$: límite inferior válido.
  - Precio $0.00$: límite inferior admitido (promociones o bonificaciones).
  - Precio $-0.01$: frontera inválida (número no negativo).

### 1.3 Pruebas de Transacciones Atómicas (ACID)
- Validación de `BEGIN -> COMMIT` ante escenarios exitosos.
- Validación de `BEGIN -> ROLLBACK` ante errores en inserción de detalle o stock insuficiente, asegurando la integridad referencial en Supabase.
- Verificación de anulación de venta con restitución automática del stock.

---

## 2. Matriz de Casos de Prueba

| ID Caso | Módulo / Archivo | Técnica | Entrada / Condición | Resultado Esperado | Estado |
|---|---|---|---|---|:---:|
| **CP-CALC-001** | `calculos.js` | Funcional | `redondear(15.556, 2)` | `15.56` | APROBADO |
| **CP-CALC-002** | `calculos.js` | Funcional | `redondear(15.554, 2)` | `15.55` | APROBADO |
| **CP-CALC-003** | `calculos.js` | Excepción | `redondear('texto')` | Lanza `TypeError` | APROBADO |
| **CP-SUBT-001** | `calculos.js` | Equivalencia | `cantidad=3, precio=10.5` | Subtotal = `31.50` | APROBADO |
| **CP-SUBT-002** | `calculos.js` | Valor Límite | `cantidad=2, precio=0` | Subtotal = `0.00` | APROBADO |
| **CP-SUBT-003** | `calculos.js` | Valor Límite | `cantidad=1, precio=15.25` | Subtotal = `15.25` | APROBADO |
| **CP-SUBT-004** | `calculos.js` | Valor Límite | `cantidad=0` | Error: cantidad mayor a 0 | APROBADO |
| **CP-SUBT-005** | `calculos.js` | Equivalencia Inv. | `cantidad=-1` | Error: cantidad mayor a 0 | APROBADO |
| **CP-SUBT-006** | `calculos.js` | Equivalencia Inv. | `cantidad=1.5` (decimal) | Error: entero requerido | APROBADO |
| **CP-SUBT-007** | `calculos.js` | Valor Límite | `precio=-0.01` | Error: precio >= 0 | APROBADO |
| **CP-IVA-001** | `calculos.js` | Funcional | `base=100, iva=15%` | IVA = `15.00` | APROBADO |
| **CP-IVA-002** | `calculos.js` | Valor Límite | `base=250, iva=0%` | IVA = `0.00` | APROBADO |
| **CP-IVA-003** | `calculos.js` | Valor Límite | `iva=-5%` o `105%` | Error: rango [0, 100] | APROBADO |
| **CP-DESC-001** | `calculos.js` | Funcional | `subtotal=200, desc=10%` | Descuento = `20.00` | APROBADO |
| **CP-STK-001** | `calculos.js` | Valor Límite | `stock=0, min=5` | `'AGOTADO'` | APROBADO |
| **CP-STK-002** | `calculos.js` | Equivalencia | `stock=-2, min=5` | `'AGOTADO'` | APROBADO |
| **CP-STK-003** | `calculos.js` | Valor Límite | `stock=1, min=5` | `'CRITICO'` | APROBADO |
| **CP-STK-004** | `calculos.js` | Valor Límite | `stock=5, min=5` | `'CRITICO'` | APROBADO |
| **CP-STK-005** | `calculos.js` | Valor Límite | `stock=6, min=5` | `'NORMAL'` | APROBADO |
| **CP-STK-006** | `calculos.js` | Equivalencia | `stock=50, min=5` | `'NORMAL'` | APROBADO |
| **CP-CHK-001** | `calculos.js` | Equivalencia | `stock=10, cantidad=3` | `true` | APROBADO |
| **CP-CHK-002** | `calculos.js` | Valor Límite | `stock=5, cantidad=5` | `true` (queda en 0) | APROBADO |
| **CP-CHK-003** | `calculos.js` | Valor Límite | `stock=5, cantidad=6` | `false` | APROBADO |
| **CP-TOT-001** | `calculos.js` | Integración | 2 ítems + IVA 15% + Descuento 10% | Desglose aritmético exacto | APROBADO |
| **CP-TOT-002** | `calculos.js` | Excepción | Ítems vacíos `[]` | Error: lista no vacía | APROBADO |
| **CP-VAL-CED-001** | `validadores.js`| Módulo 10 | Cédula válida Pichincha (`1710034065`)| `esValida = true` | APROBADO |
| **CP-VAL-CED-002** | `validadores.js`| Entorno Test | Cédula `TEST-CLI-001` | `esValida = true` | APROBADO |
| **CP-VAL-CED-003** | `validadores.js`| Valor Límite | Cédula con 9 dígitos | `esValida = false` | APROBADO |
| **CP-VAL-CED-004** | `validadores.js`| Valor Límite | Cédula con 11 dígitos | `esValida = false` | APROBADO |
| **CP-VAL-CED-005** | `validadores.js`| Equivalencia | Código provincia 99 | `esValida = false` | APROBADO |
| **CP-VAL-CED-006** | `validadores.js`| Dígito Verif. | Cédula con último dígito alterado | `esValida = false` | APROBADO |
| **CP-VAL-EML-001** | `validadores.js`| Regex | `test@empresa.com` | `true` | APROBADO |
| **CP-VAL-EML-002** | `validadores.js`| Regex Inválido| `correo-sin-arroba.com` | `false` | APROBADO |
| **CP-SERV-PROD-001**| `productoService`| Mocked Repo | Producto con datos válidos | Creado con ID y nivel `NORMAL` | APROBADO |
| **CP-SERV-PROD-002**| `productoService`| Regla Negocio | Nombre en blanco | Error: nombre obligatorio | APROBADO |
| **CP-SERV-PROD-003**| `productoService`| Regla Negocio | Precio negativo | Error: precio >= 0 | APROBADO |
| **CP-SERV-PROD-004**| `productoService`| Regla Negocio | Stock negativo | Error: stock >= 0 | APROBADO |
| **CP-SERV-PROD-005**| `productoService`| Integridad BD | Categoría inexistente | Error: categoría no existe | APROBADO |
| **CP-SERV-PROD-006**| `productoService`| Integridad BD | Proveedor inexistente | Error: proveedor no existe | APROBADO |
| **CP-SERV-VENTA-001**| `ventaService` | Transacción | Venta válida multi-ítem | `BEGIN -> COMMIT`, stock restado | APROBADO |
| **CP-SERV-VENTA-002**| `ventaService` | Regla Negocio | Cliente inactivo (`activo=false`) | Error: cliente inactivo | APROBADO |
| **CP-SERV-VENTA-003**| `ventaService` | Integridad BD | Cliente inexistente | Error: cliente no existe | APROBADO |
| **CP-SERV-VENTA-004**| `ventaService` | Regla Negocio | Lista de ítems vacía | Error: al menos 1 producto | APROBADO |
| **CP-SERV-VENTA-005**| `ventaService` | Regla Negocio | Producto duplicado en ítems | Error: duplicado en orden | APROBADO |
| **CP-SERV-VENTA-006**| `ventaService` | Valor Límite | Stock = 5, cantidad = 6 | Error: stock insuficiente | APROBADO |
| **CP-SERV-VENTA-007**| `ventaService` | Valor Límite | Stock = 5, cantidad = 5 | Venta exitosa (stock 0) | APROBADO |
| **CP-SERV-VENTA-008**| `ventaService` | Rollback ACID | Falla en inserción de detalle | `ROLLBACK` ejecutado | APROBADO |
| **CP-SERV-VENTA-009**| `ventaService` | Restauración | Anular venta `COMPLETADA` | Estado `ANULADA` y stock restituido | APROBADO |
| **CP-SERV-VENTA-010**| `ventaService` | Regla Negocio | Anular venta ya `ANULADA` | Error: ya anulada previamente | APROBADO |
| **CP-INT-001** | `api.test.js` | Integración API | `GET /api/health` | HTTP 200, status `UP` | APROBADO |
| **CP-INT-002** | `api.test.js` | Integración DB | `GET /api/productos` | HTTP 200, array productos | APROBADO |
| **CP-INT-003** | `api.test.js` | Integración DB | `GET /api/catalogos/categorias` | HTTP 200 | APROBADO |
| **CP-INT-004** | `api.test.js` | Integración DB | `GET /api/catalogos/proveedores`| HTTP 200 | APROBADO |
| **CP-INT-005** | `api.test.js` | Integración DB | `GET /api/clientes` | HTTP 200 | APROBADO |
| **CP-INT-006** | `api.test.js` | Integración API | `GET /api/dashboard/metricas` | HTTP 200, objeto métricas | APROBADO |
| **CP-INT-007** | `api.test.js` | Negativa API | `POST /api/productos` datos inválidos | HTTP 400 | APROBADO |
| **CP-INT-008** | `api.test.js` | Negativa API | `POST /api/ventas` sin cliente | HTTP 400 | APROBADO |
| **CP-INT-009** | `api.test.js` | Negativa API | `POST /api/ventas` stock excesivo | HTTP 400 (Stock insuficiente) | APROBADO |
| **CP-INT-010** | `api.test.js` | Negativa API | `GET /api/ruta-que-no-existe` | HTTP 404 | APROBADO |

---

## 3. Comandos de Ejecución de Pruebas

```bash
# Navegar al directorio del sistema
cd SistemaVentas

# Ejecutar toda la suite de pruebas
npm test

# Ejecutar pruebas unitarias (servicios y cálculos)
npm run test:unit

# Ejecutar pruebas de integración (API REST y conexión Supabase)
npm run test:integration

# Generar reporte de cobertura de código (HTML y consola)
npm run test:coverage
```
