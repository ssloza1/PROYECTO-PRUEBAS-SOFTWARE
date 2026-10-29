# Especificación de Reglas de Negocio (RN)

**Sistema:** Inventario y Ventas  
**Materia:** Pruebas de Software  

---

## 1. Módulo de Productos e Inventario

- **RN-PROD-01 (Nombre Obligatorio):** Todo producto debe poseer un nombre con una longitud mínima de 2 caracteres y máxima de 150 caracteres. No se admiten nombres compuestos únicamente por espacios en blanco.
- **RN-PROD-02 (Precios No Negativos):** El precio de venta al público debe ser un valor numérico mayor o igual a $0.00$.
- **RN-PROD-03 (Stock No Negativo):** El stock de unidades en bodega debe ser un número entero mayor o igual a cero ($stock \ge 0$).
- **RN-PROD-04 (Umbral de Stock Mínimo):** Cada producto debe definir un umbral de stock mínimo ($stock\_minimo \ge 0$). Si $stock \le stock\_minimo$ y $stock > 0$, el producto se clasifica con nivel de alerta `CRITICO`. Si $stock \le 0$, su nivel es `AGOTADO`.
- **RN-PROD-05 (Integridad de Categoría y Proveedor):** Todo producto debe pertenecer a una categoría y a un proveedor existentes y válidos en la base de datos.
- **RN-PROD-06 (Baja Lógica):** La eliminación de un producto no borra físicamente el registro para mantener la integridad referencial histórica con ventas previas; en su lugar, se actualiza el campo `activo = FALSE`.

---

## 2. Módulo de Clientes

- **RN-CLI-01 (Datos de Identificación):** El nombre del cliente es obligatorio (2 a 120 caracteres). La cédula es obligatoria y única en el sistema.
- **RN-CLI-02 (Validación de Cédula):** La cédula debe cumplir con el algoritmo oficial de validación ecuatoriano (10 dígitos numéricos, código de provincia entre 01 y 24, tercer dígito menor a 6 para personas naturales, y dígito verificador módulo 10). Se admiten cédulas de prueba con prefijo `TEST-`.
- **RN-CLI-03 (Estado de Habilitación):** Solo los clientes con `activo = TRUE` pueden realizar compras o tener facturas a su nombre.

---

## 3. Módulo de Ventas y Facturación

- **RN-VENTA-01 (Composición Mínima de Orden):** Toda venta debe incluir al menos un producto con cantidad entera mayor a cero.
- **RN-VENTA-02 (Unicidad de Ítems):** No se permiten productos duplicados en líneas de detalle separadas de una misma venta. Deben consolidarse en una sola línea con la cantidad acumulada.
- **RN-VENTA-03 (Verificación de Stock Disponible):** Antes de confirmar la venta, se valida que para cada ítem se cumpla: $stock\_actual \ge cantidad\_solicitada$. Si un solo ítem no cumple la condición, la venta completa es rechazada.
- **RN-VENTA-04 (Atomicidad Transaccional ACID):** La creación de la cabecera en `ventas`, los registros en `detalle_venta`, y el decremento de stock en `productos` se ejecutan dentro de una única transacción SQL (`BEGIN ... COMMIT`). Si surge cualquier excepción, se ejecuta inmediatamente `ROLLBACK`.
- **RN-VENTA-05 (Consistencia de Totales):** El total de la venta debe coincidir de forma exacta con la sumatoria de los subtotales de cada detalle ($subtotal = cantidad \times precio\_unitario$) menos descuentos y más impuestos calculados.
- **RN-VENTA-06 (Estados de Venta):** Una venta solo puede estar en estado `COMPLETADA` o `ANULADA`.
- **RN-VENTA-07 (Anulación y Reposición de Inventario):** Solo se pueden anular ventas en estado `COMPLETADA`. Al anularse:
  1. El estado cambia a `ANULADA`.
  2. Para cada producto incluido en el detalle, se incrementa automáticamente su stock en el inventario ($stock = stock + cantidad$).
  3. No se permite anular una venta previamente anulada.