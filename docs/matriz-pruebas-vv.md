# Matriz de casos de prueba - Verificación y Validación (V&V)

**Proyecto:** Sistema de Inventario y Ventas  
**Herramientas:** ESLint (verificación estática) · Jest + Supertest (validación dinámica)  
**Casos documentados en esta matriz:** 240 identificadores (unitarios: 178, API: 62)  

> Los casos `CP-DEF-*` y `CP-DEF-API-*` son **defectos conocidos**: están escritos con `test.failing`, es decir, describen el comportamiento correcto esperado y "pasan" mientras el defecto exista.

| ID | Archivo (tests/) | Descripción |
|---|---|---|
| **CP-API-APP-001** | `api/app.test.js` | GET /api/health responde 200 con estado UP |
| **CP-API-APP-002** | `api/app.test.js` | una ruta inexistente responde 404 |
| **CP-API-APP-003** | `api/app.test.js` | GET / sirve el frontend estático (index.html) |
| **CP-API-APP-004** | `api/app.test.js` | un JSON mal formado responde 400 con exito=false (errorHandler) |
| **CP-API-APP-005** | `api/app.test.js` | acepta cuerpos urlencoded (express.urlencoded) |
| **CP-API-APP-006** | `api/app.test.js` | incluye la cabecera CORS (cors) |
| **CP-API-CAT-001** | `api/catalogos.api.test.js` | GET lista las categorías |
| **CP-API-CAT-002** | `api/catalogos.api.test.js` | POST crea una categoría y luego aparece en el GET |
| **CP-API-CAT-003** | `api/catalogos.api.test.js` | POST sin descripción guarda null |
| **CP-API-CAT-004** | `api/catalogos.api.test.js` | POST rechaza nombres vacíos, cortos o demasiado largos (valores límite 2 y 100) |
| **CP-API-CAT-005** | `api/catalogos.api.test.js` | GET lista todos los proveedores y filtra por ?activo= |
| **CP-API-CAT-006** | `api/catalogos.api.test.js` | POST registra un proveedor con datos normalizados |
| **CP-API-CAT-007** | `api/catalogos.api.test.js` | POST con solo el nombre usa valores por defecto (activo = true) |
| **CP-API-CAT-008** | `api/catalogos.api.test.js` | POST rechaza nombre inválido y correo inválido |
| **CP-API-CLI-001** | `api/clientes.api.test.js` | lista los clientes existentes |
| **CP-API-CLI-002** | `api/clientes.api.test.js` | filtros ?activo=true y búsqueda ?q= |
| **CP-API-CLI-003** | `api/clientes.api.test.js` | devuelve el cliente existente |
| **CP-API-CLI-004** | `api/clientes.api.test.js` | ID inválido o inexistente responde 400 |
| **CP-API-CLI-005** | `api/clientes.api.test.js` | registra un cliente válido, normaliza el correo y responde 201 |
| **CP-API-CLI-006** | `api/clientes.api.test.js` | acepta cédulas de prueba con prefijo TEST- (RN-CLI-02) |
| **CP-API-CLI-007** | `api/clientes.api.test.js` | rechaza cédulas con provincia inválida o tercer dígito mayor o igual a 6 |
| **CP-API-CLI-008** | `api/clientes.api.test.js` | rechaza datos inválidos con 400 y mensaje |
| **CP-API-CLI-009** | `api/clientes.api.test.js` | actualiza nombre y correo (el correo se guarda en minúsculas) |
| **CP-API-CLI-010** | `api/clientes.api.test.js` | rechaza nombre o correo inválidos y ID inexistente |
| **CP-API-CLI-011** | `api/clientes.api.test.js` | desactiva al cliente (baja lógica) |
| **CP-API-CLI-012** | `api/clientes.api.test.js` | ID inválido o inexistente responde 400 |
| **CP-API-DASH-001** | `api/dashboard.api.test.js` | devuelve las métricas consolidadas con estado 200 |
| **CP-API-DASH-002** | `api/dashboard.api.test.js` | si la base de datos falla responde 500 con exito=false |
| **CP-DEF-API-001** | `api/defectos-conocidos.api.test.js` | POST /api/clientes sin cédula debe responder 4xx (hoy responde 500) |
| **CP-DEF-API-002** | `api/defectos-conocidos.api.test.js` | POST /api/clientes con dígito verificador incorrecto debe responder 4xx (hoy 500) |
| **CP-DEF-API-003** | `api/defectos-conocidos.api.test.js` | POST /api/clientes con cédula repetida debe responder 4xx (hoy responde 500) |
| **CP-DEF-API-004** | `api/defectos-conocidos.api.test.js` | GET /api/ventas/:id inexistente debe responder 4xx (hoy responde 500) |
| **CP-DEF-API-005** | `api/defectos-conocidos.api.test.js` | POST /api/ventas/:id/anular de una venta inexistente debe responder 4xx (hoy 500) |
| **CP-API-PROD-001** | `api/productos.api.test.js` | lista todos los productos con su nivel de stock calculado |
| **CP-API-PROD-002** | `api/productos.api.test.js` | filtro ?activo=true excluye productos desactivados |
| **CP-API-PROD-003** | `api/productos.api.test.js` | filtro ?stock_bajo=true devuelve solo CRITICO y AGOTADO |
| **CP-API-PROD-004** | `api/productos.api.test.js` | filtro ?id_categoria=1 y búsqueda ?q=teclado |
| **CP-API-PROD-005** | `api/productos.api.test.js` | devuelve el producto existente con nivel_stock |
| **CP-API-PROD-006** | `api/productos.api.test.js` | ID no numérico responde 400 |
| **CP-API-PROD-007** | `api/productos.api.test.js` | producto inexistente responde 400 (comportamiento actual del errorHandler) |
| **CP-API-PROD-008** | `api/productos.api.test.js` | crea un producto válido y responde 201 |
| **CP-API-PROD-009** | `api/productos.api.test.js` | el producto creado queda consultable por ID (flujo POST y luego GET) |
| **CP-API-PROD-010** | `api/productos.api.test.js` | rechaza datos inválidos con 400 y mensaje (partición de equivalencia inválida) |
| **CP-API-PROD-011** | `api/productos.api.test.js` | valor límite precio = 0 es válido |
| **CP-API-PROD-012** | `api/productos.api.test.js` | sin stock ni stock_minimo se asumen 0 y queda AGOTADO |
| **CP-API-PROD-013** | `api/productos.api.test.js` | actualiza precio y stock y recalcula el nivel |
| **CP-API-PROD-014** | `api/productos.api.test.js` | rechaza actualizaciones inválidas con 400 |
| **CP-API-PROD-015** | `api/productos.api.test.js` | ID inválido o inexistente responde 400 |
| **CP-API-PROD-016** | `api/productos.api.test.js` | desactiva el producto y no lo borra físicamente (RN-PROD-06) |
| **CP-API-PROD-017** | `api/productos.api.test.js` | ID inválido o inexistente responde 400 |
| **CP-API-VENT-001** | `api/ventas.api.test.js` | registra una venta válida, calcula totales y responde 201 |
| **CP-API-VENT-002** | `api/ventas.api.test.js` | la venta descuenta stock y usa una transacción BEGIN -> COMMIT (RN-VENTA-04) |
| **CP-API-VENT-003** | `api/ventas.api.test.js` | flujo completo - POST y luego GET (lista y detalle) - Actividad 1 del lab |
| **CP-API-VENT-004** | `api/ventas.api.test.js` | valor límite - stock 5 y se piden exactamente 5 -> venta válida y stock en 0 |
| **CP-API-VENT-005** | `api/ventas.api.test.js` | valor límite - stock 5 y se piden 6 -> 400 y el stock no cambia (RN-VENTA-03) |
| **CP-API-VENT-006** | `api/ventas.api.test.js` | rechaza ventas inválidas con 400 y mensaje (particiones de equivalencia inválidas) |
| **CP-API-VENT-007** | `api/ventas.api.test.js` | la lista vacía inicial responde 200 con total 0 |
| **CP-API-VENT-008** | `api/ventas.api.test.js` | filtros ?id_cliente= y ?estado= (se convierte a mayúsculas) |
| **CP-API-VENT-009** | `api/ventas.api.test.js` | GET /api/ventas/:id con ID inválido responde 400 |
| **CP-API-VENT-010** | `api/ventas.api.test.js` | anula la venta y repone el stock (RN-VENTA-07) |
| **CP-API-VENT-011** | `api/ventas.api.test.js` | no permite anular dos veces la misma venta |
| **CP-API-VENT-012** | `api/ventas.api.test.js` | ID inválido responde 400 |
| **CP-CALC-001** | `unit/calculos.test.js` | Redondeo estándar a 2 decimales hacia arriba |
| **CP-CALC-002** | `unit/calculos.test.js` | Redondeo estándar a 2 decimales hacia abajo |
| **CP-CALC-003** | `unit/calculos.test.js` | Debe lanzar TypeError si el valor no es un número |
| **CP-SUBT-001** | `unit/calculos.test.js` | Cálculo correcto con valores válidos (caso típico) |
| **CP-SUBT-002** | `unit/calculos.test.js` | Límite inferior válido de precio (precio = 0) |
| **CP-SUBT-003** | `unit/calculos.test.js` | Límite inferior válido de cantidad (cantidad = 1) |
| **CP-SUBT-004** | `unit/calculos.test.js` | Valor frontera inválido: cantidad = 0 debe lanzar error |
| **CP-SUBT-005** | `unit/calculos.test.js` | Valor frontera inválido: cantidad negativa debe lanzar error |
| **CP-SUBT-006** | `unit/calculos.test.js` | Cantidad no entera (ej. decimal 1.5) debe lanzar error |
| **CP-SUBT-007** | `unit/calculos.test.js` | Valor frontera inválido: precio negativo debe lanzar error |
| **CP-IVA-001** | `unit/calculos.test.js` | Cálculo de IVA al 15% |
| **CP-IVA-002** | `unit/calculos.test.js` | IVA al 0% devuelve 0 |
| **CP-IVA-003** | `unit/calculos.test.js` | Rechaza porcentajes de IVA fuera de rango [0, 100] |
| **CP-DESC-001** | `unit/calculos.test.js` | Cálculo de descuento válido |
| **CP-DESC-002** | `unit/calculos.test.js` | Descuento 0% devuelve 0 |
| **CP-STK-001** | `unit/calculos.test.js` | Partición AGOTADO (stock = 0) |
| **CP-STK-002** | `unit/calculos.test.js` | Partición AGOTADO (stock negativo) |
| **CP-STK-003** | `unit/calculos.test.js` | Partición CRITICO - Valor frontera inferior (stock = 1) |
| **CP-STK-004** | `unit/calculos.test.js` | Partición CRITICO - Valor frontera superior (stock == stockMinimo = 5) |
| **CP-STK-005** | `unit/calculos.test.js` | Partición NORMAL - Valor frontera justo superior (stock = stockMinimo + 1 = 6) |
| **CP-STK-006** | `unit/calculos.test.js` | Partición NORMAL - Stock holgado (stock = 50) |
| **CP-CHK-001** | `unit/calculos.test.js` | Stock mayor que cantidad (suficiente) |
| **CP-CHK-002** | `unit/calculos.test.js` | Valor límite: Stock exactamente igual a la cantidad (suficiente) |
| **CP-CHK-003** | `unit/calculos.test.js` | Valor límite: Cantidad 1 unidad mayor que el stock (insuficiente) |
| **CP-CHK-004** | `unit/calculos.test.js` | Cantidad requerida 0 o negativa debe lanzar error |
| **CP-TOT-001** | `unit/calculos.test.js` | Calcula totales correctamente para varios ítems con IVA y descuento |
| **CP-TOT-002** | `unit/calculos.test.js` | Lanza error si la lista de ítems está vacía |
| **CP-SERV-CAT-001** | `unit/catalogoService.test.js` | listarCategorias devuelve lo que entrega el repositorio |
| **CP-SERV-CAT-002** | `unit/catalogoService.test.js` | registra una categoría recortando espacios |
| **CP-SERV-CAT-003** | `unit/catalogoService.test.js` | sin descripción se guarda null |
| **CP-SERV-CAT-004** | `unit/catalogoService.test.js` | rechaza el nombre %p |
| **CP-SERV-CAT-005** | `unit/catalogoService.test.js` | listarProveedores entrega filtros al repositorio (y {} por defecto) |
| **CP-SERV-CAT-006** | `unit/catalogoService.test.js` | registra un proveedor completo normalizando datos |
| **CP-SERV-CAT-007** | `unit/catalogoService.test.js` | registra un proveedor mínimo con valores por defecto |
| **CP-SERV-CAT-008** | `unit/catalogoService.test.js` | rechaza el nombre %p |
| **CP-SERV-CAT-009** | `unit/catalogoService.test.js` | rechaza un correo inválido |
| **CP-SERV-CLI-001** | `unit/clienteService.test.js` | listarClientes entrega los filtros al repositorio (y {} por defecto) |
| **CP-SERV-CLI-002** | `unit/clienteService.test.js` | obtenerPorId devuelve el cliente existente |
| **CP-SERV-CLI-003** | `unit/clienteService.test.js` | obtenerPorId rechaza el ID inválido %p |
| **CP-SERV-CLI-004** | `unit/clienteService.test.js` | obtenerPorId rechaza un cliente inexistente |
| **CP-SERV-CLI-005** | `unit/clienteService.test.js` | registra un cliente válido normalizando espacios y minúsculas |
| **CP-SERV-CLI-006** | `unit/clienteService.test.js` | sin datos opcionales guarda null y respeta activo = false |
| **CP-SERV-CLI-007** | `unit/clienteService.test.js` | rechaza nombre inválido %p (valores límite 2 y 120) |
| **CP-SERV-CLI-008** | `unit/clienteService.test.js` | acepta nombres en los valores límite (2 y 120 caracteres) |
| **CP-SERV-CLI-009** | `unit/clienteService.test.js` | rechaza si falta la cédula |
| **CP-SERV-CLI-010** | `unit/clienteService.test.js` | rechaza una cédula con formato inválido e incluye la razón |
| **CP-SERV-CLI-011** | `unit/clienteService.test.js` | rechaza una cédula ya registrada (unicidad) |
| **CP-SERV-CLI-012** | `unit/clienteService.test.js` | rechaza un correo con formato inválido |
| **CP-SERV-CLI-013** | `unit/clienteService.test.js` | actualiza y pasa el correo en minúsculas |
| **CP-SERV-CLI-014** | `unit/clienteService.test.js` | correo %p no se valida ni se transforma |
| **CP-SERV-CLI-015** | `unit/clienteService.test.js` | rechaza ID inválido, cliente inexistente, nombre corto y correo inválido |
| **CP-SERV-CLI-016** | `unit/clienteService.test.js` | desactiva un cliente existente |
| **CP-SERV-CLI-017** | `unit/clienteService.test.js` | rechaza ID inválido o cliente inexistente |
| **CP-CFG-DB-001** | `unit/config.db.test.js` | con DATABASE_URL usa connectionString, SSL sin verificar y pool de 2 en test |
| **CP-CFG-DB-002** | `unit/config.db.test.js` | DB_SSL=false desactiva SSL |
| **CP-CFG-DB-003** | `unit/config.db.test.js` | sin DATABASE_URL usa las variables individuales DB_* |
| **CP-CFG-DB-004** | `unit/config.db.test.js` | sin ninguna variable usa valores por defecto para host, puerto y base de datos |
| **CP-CFG-DB-005** | `unit/config.db.test.js` | fuera de test el pool es de 10 conexiones |
| **CP-CFG-DB-006** | `unit/config.db.test.js` | query delega en pool.query y devuelve el resultado |
| **CP-CFG-DB-007** | `unit/config.db.test.js` | una consulta lenta (> 500 ms) fuera de test genera una advertencia |
| **CP-CFG-DB-008** | `unit/config.db.test.js` | una consulta rápida o en entorno test no genera advertencia |
| **CP-CFG-DB-009** | `unit/config.db.test.js` | getClient obtiene una conexión del pool y closePool cierra el pool |
| **CP-CFG-DB-010** | `unit/config.db.test.js` | el evento "error" del pool se registra en consola sin detener la aplicación |
| **CP-CFG-SUP-001** | `unit/config.supabase.test.js` | con URL y SUPABASE_SECRET_KEY crea el cliente del SDK |
| **CP-CFG-SUP-002** | `unit/config.supabase.test.js` | acepta SUPABASE_KEY como clave alternativa |
| **CP-CFG-SUP-003** | `unit/config.supabase.test.js` | sin clave exporta null y no muestra aviso en entorno test |
| **CP-CFG-SUP-004** | `unit/config.supabase.test.js` | sin clave fuera de test exporta null y muestra un aviso informativo |
| **CP-DEF-001** | `unit/defectos-conocidos.test.js` | validarNumeroPositivo no debe aceptar cadena vacía, null ni booleanos (Number() los convierte en 0 o 1) |
| **CP-DEF-002** | `unit/defectos-conocidos.test.js` | validarNumeroPositivo no debe aceptar Infinity |
| **CP-DEF-003** | `unit/defectos-conocidos.test.js` | validarEnteroPositivo no debe aceptar cadena vacía, null ni booleanos |
| **CP-DEF-004** | `unit/defectos-conocidos.test.js` | calcularIVA(27.9, 15) debe ser 4.19 (4.185 redondeado hacia arriba); hoy da 4.18 por error de coma flotante |
| **CP-DEF-005** | `unit/defectos-conocidos.test.js` | registrarProducto debe rechazar precio null (hoy lo guarda como 0) |
| **CP-DEF-006** | `unit/defectos-conocidos.test.js` | registrarCliente no debe lanzar TypeError con un teléfono numérico (debe normalizarlo o rechazarlo con mensaje) |
| **CP-DEF-007** | `unit/defectos-conocidos.test.js` | db.js no debe tener una contraseña por defecto escrita en el código fuente |
| **CP-ERR-001** | `unit/errorHandler.test.js` | palabra clave "%s" se mapea a 400 |
| **CP-ERR-002** | `unit/errorHandler.test.js` | un error con err.status = 400 responde 400 aunque el mensaje no tenga palabras clave |
| **CP-ERR-003** | `unit/errorHandler.test.js` | respeta cualquier err.status explícito (ej. 404) |
| **CP-ERR-004** | `unit/errorHandler.test.js` | un error inesperado responde 500 con su mensaje |
| **CP-ERR-005** | `unit/errorHandler.test.js` | un error sin mensaje responde 500 con el texto genérico |
| **CP-ERR-006** | `unit/errorHandler.test.js` | en entorno test NO se registran errores 500 en consola ni se expone el stack |
| **CP-ERR-007** | `unit/errorHandler.test.js` | en producción un error 500 se registra en consola y no expone el stack |
| **CP-ERR-008** | `unit/errorHandler.test.js` | en desarrollo la respuesta incluye el stack para depurar |
| **CP-SERV-PROD-010** | `unit/productoService.ampliado.test.js` | devuelve el producto con su nivel de stock |
| **CP-SERV-PROD-011** | `unit/productoService.ampliado.test.js` | rechaza el ID inválido %p |
| **CP-SERV-PROD-012** | `unit/productoService.ampliado.test.js` | rechaza si no se envía el precio |
| **CP-SERV-PROD-013** | `unit/productoService.ampliado.test.js` | rechaza el precio %p |
| **CP-SERV-PROD-014** | `unit/productoService.ampliado.test.js` | valor límite - precio 0 es válido |
| **CP-SERV-PROD-015** | `unit/productoService.ampliado.test.js` | rechaza stock decimal y stock mínimo negativo o decimal |
| **CP-SERV-PROD-016** | `unit/productoService.ampliado.test.js` | sin stock ni stock_minimo se asume 0 y el nivel es AGOTADO |
| **CP-SERV-PROD-017** | `unit/productoService.ampliado.test.js` | rechaza id_categoria %p |
| **CP-SERV-PROD-018** | `unit/productoService.ampliado.test.js` | rechaza id_proveedor %p |
| **CP-SERV-PROD-019** | `unit/productoService.ampliado.test.js` | normaliza descripción y respeta activo = false |
| **CP-SERV-PROD-020** | `unit/productoService.ampliado.test.js` | convierte los números y deja undefined lo que no se envía |
| **CP-SERV-PROD-021** | `unit/productoService.ampliado.test.js` | actualización parcial (solo nombre) no toca precio ni stock |
| **CP-SERV-PROD-022** | `unit/productoService.ampliado.test.js` | rechaza nombre corto, precio negativo, stock decimal y stock mínimo negativo |
| **CP-SERV-PROD-023** | `unit/productoService.ampliado.test.js` | rechaza ID inválido y producto inexistente |
| **CP-SERV-PROD-024** | `unit/productoService.ampliado.test.js` | rechaza ID inválido y producto inexistente |
| **CP-SERV-PROD-001** | `unit/productoService.test.js` | Registra producto exitosamente cuando todos los datos son válidos |
| **CP-SERV-PROD-002** | `unit/productoService.test.js` | Rechaza producto con nombre vacío o muy corto |
| **CP-SERV-PROD-003** | `unit/productoService.test.js` | Rechaza producto con precio negativo |
| **CP-SERV-PROD-004** | `unit/productoService.test.js` | Rechaza producto con stock negativo |
| **CP-SERV-PROD-005** | `unit/productoService.test.js` | Rechaza si la categoría especificada no existe en la base de datos |
| **CP-SERV-PROD-006** | `unit/productoService.test.js` | Rechaza si el proveedor no existe en la base de datos |
| **CP-SERV-PROD-007** | `unit/productoService.test.js` | Calcula dinámicamente el nivel de stock en la lista |
| **CP-SERV-PROD-008** | `unit/productoService.test.js` | Lanza error al buscar por ID inexistente |
| **CP-SERV-PROD-009** | `unit/productoService.test.js` | Desactiva producto existente |
| **CP-REPO-CAT-001** | `unit/repositories.test.js` | findAllCategorias consulta la tabla categorias ordenada |
| **CP-REPO-CAT-002** | `unit/repositories.test.js` | usa el client de transacción cuando se entrega |
| **CP-REPO-CAT-003** | `unit/repositories.test.js` | findCategoriaById devuelve la fila o null |
| **CP-REPO-CAT-004** | `unit/repositories.test.js` | createCategoria inserta y devuelve la fila (descripción null por defecto) |
| **CP-REPO-CAT-005** | `unit/repositories.test.js` | findAllProveedores aplica el filtro activo solo si se envía |
| **CP-REPO-CAT-006** | `unit/repositories.test.js` | findProveedorById devuelve la fila o null |
| **CP-REPO-CAT-007** | `unit/repositories.test.js` | createProveedor usa null y activo=true por defecto, o los valores enviados |
| **CP-REPO-CLI-001** | `unit/repositories.test.js` | findAll sin filtros no agrega condiciones |
| **CP-REPO-CLI-002** | `unit/repositories.test.js` | findAll con filtros activo y búsqueda arma los parámetros en orden |
| **CP-REPO-CLI-003** | `unit/repositories.test.js` | findAll usa el client de transacción cuando se entrega |
| **CP-REPO-CLI-004** | `unit/repositories.test.js` | findById y findByCedula devuelven la fila o null |
| **CP-REPO-CLI-005** | `unit/repositories.test.js` | create guarda null por defecto y activo=true si no se indica |
| **CP-REPO-CLI-006** | `unit/repositories.test.js` | update envía los campos y el ID al final; devuelve null si no existe |
| **CP-REPO-CLI-007** | `unit/repositories.test.js` | softDelete marca activo = FALSE; devuelve null si no existe |
| **CP-REPO-PROD-001** | `unit/repositories.test.js` | findAll sin filtros no agrega condiciones |
| **CP-REPO-PROD-002** | `unit/repositories.test.js` | findAll con todos los filtros arma SQL y parámetros en orden |
| **CP-REPO-PROD-003** | `unit/repositories.test.js` | findAll usa el client de transacción cuando se entrega |
| **CP-REPO-PROD-004** | `unit/repositories.test.js` | findById devuelve la fila o null y usa client si se entrega |
| **CP-REPO-PROD-005** | `unit/repositories.test.js` | create aplica valores por defecto (descripción null, stock 0, activo true) |
| **CP-REPO-PROD-006** | `unit/repositories.test.js` | update envía los campos y el ID al final; devuelve null si no existe |
| **CP-REPO-PROD-007** | `unit/repositories.test.js` | updateStock suma o resta y protege contra stock negativo (WHERE stock + delta >= 0) |
| **CP-REPO-PROD-008** | `unit/repositories.test.js` | updateStock devuelve null cuando el stock quedaría negativo (sin filas) |
| **CP-REPO-PROD-009** | `unit/repositories.test.js` | softDelete marca activo = FALSE; devuelve null si no existe |
| **CP-REPO-VENT-001** | `unit/repositories.test.js` | findAll sin filtros no agrega condiciones |
| **CP-REPO-VENT-002** | `unit/repositories.test.js` | findAll con filtros id_cliente y estado |
| **CP-REPO-VENT-003** | `unit/repositories.test.js` | findByIdWithDetails devuelve null si la venta no existe (sin consultar detalles) |
| **CP-REPO-VENT-004** | `unit/repositories.test.js` | findByIdWithDetails une la cabecera con sus detalles |
| **CP-REPO-VENT-005** | `unit/repositories.test.js` | createHeader inserta con estado por defecto COMPLETADA |
| **CP-REPO-VENT-006** | `unit/repositories.test.js` | createDetail inserta el detalle y devuelve la fila |
| **CP-REPO-VENT-007** | `unit/repositories.test.js` | updateStatus cambia el estado; devuelve null si no existe |
| **CP-REPO-VENT-008** | `unit/repositories.test.js` | findDetailsByVentaId consulta por venta con db o con client |
| **CP-VAL-CED-001** | `unit/validadores.test.js` | Cédula válida con algoritmo módulo 10 (ej. Pichincha 1710034065) |
| **CP-VAL-CED-002** | `unit/validadores.test.js` | Cédulas de entorno de prueba con prefijo TEST- |
| **CP-VAL-CED-003** | `unit/validadores.test.js` | Rechaza longitud menor a 10 dígitos |
| **CP-VAL-CED-004** | `unit/validadores.test.js` | Rechaza longitud mayor a 10 dígitos |
| **CP-VAL-CED-005** | `unit/validadores.test.js` | Rechaza código de provincia inválido (> 24) |
| **CP-VAL-CED-006** | `unit/validadores.test.js` | Rechaza dígito verificador erróneo |
| **CP-VAL-CED-007** | `unit/validadores.test.js` | Rechaza valor nulo o vacío |
| **CP-VAL-EML-001** | `unit/validadores.test.js` | Emails válidos |
| **CP-VAL-EML-002** | `unit/validadores.test.js` | Emails inválidos sin @ o sin dominio |
| **CP-VAL-TXT-001** | `unit/validadores.test.js` | Texto dentro del rango admitido |
| **CP-VAL-TXT-002** | `unit/validadores.test.js` | Texto inferior al límite mínimo |
| **CP-VAL-TXT-003** | `unit/validadores.test.js` | Texto superior al límite máximo |
| **CP-VAL-TXT-004** | `unit/validadores.test.js` | Solo espacios en blanco no cumple longitud mínima |
| **CP-VAL-NUM-001** | `unit/validadores.test.js` | Números positivos válidos |
| **CP-VAL-NUM-002** | `unit/validadores.test.js` | Comportamiento con cero según bandera permitirCero |
| **CP-VAL-NUM-003** | `unit/validadores.test.js` | Entero positivo rechaza decimales |
| **CP-SERV-VENTA-011** | `unit/ventaService.ampliado.test.js` | listarVentas entrega filtros al repositorio (y {} por defecto) |
| **CP-SERV-VENTA-012** | `unit/ventaService.ampliado.test.js` | obtenerPorId devuelve la venta con sus detalles |
| **CP-SERV-VENTA-013** | `unit/ventaService.ampliado.test.js` | obtenerPorId rechaza ID inválido y venta inexistente |
| **CP-SERV-VENTA-014** | `unit/ventaService.ampliado.test.js` | rechaza id_cliente %p |
| **CP-SERV-VENTA-015** | `unit/ventaService.ampliado.test.js` | rechaza si items no es un arreglo |
| **CP-SERV-VENTA-016** | `unit/ventaService.ampliado.test.js` | rechaza un ítem con ID de producto inválido |
| **CP-SERV-VENTA-017** | `unit/ventaService.ampliado.test.js` | rechaza la cantidad %p |
| **CP-SERV-VENTA-018** | `unit/ventaService.ampliado.test.js` | rechaza producto inexistente y producto inactivo |
| **CP-SERV-VENTA-019** | `unit/ventaService.ampliado.test.js` | rechaza porcentajes de IVA o descuento fuera de [0, 100] antes de abrir la transacción |
| **CP-SERV-VENTA-020** | `unit/ventaService.ampliado.test.js` | calcula totales con IVA y descuento y los guarda en la cabecera |
| **CP-SERV-VENTA-021** | `unit/ventaService.ampliado.test.js` | la transacción empieza con BEGIN y termina con COMMIT |
| **CP-SERV-VENTA-022** | `unit/ventaService.ampliado.test.js` | ROLLBACK si falla la creación de la cabecera |
| **CP-SERV-VENTA-023** | `unit/ventaService.ampliado.test.js` | ROLLBACK si no se pudo descontar el stock (otra venta lo consumió) |
| **CP-SERV-VENTA-024** | `unit/ventaService.ampliado.test.js` | rechaza ID inválido y venta inexistente |
| **CP-SERV-VENTA-025** | `unit/ventaService.ampliado.test.js` | ROLLBACK si falla la reposición del stock durante la anulación |
| **CP-SERV-VENTA-001** | `unit/ventaService.test.js` | Registra venta exitosa, descuenta stock y confirma transacción |
| **CP-SERV-VENTA-002** | `unit/ventaService.test.js` | Rechaza venta si el cliente está inactivo |
| **CP-SERV-VENTA-003** | `unit/ventaService.test.js` | Rechaza venta si el cliente no existe |
| **CP-SERV-VENTA-004** | `unit/ventaService.test.js` | Rechaza venta si la lista de ítems está vacía |
| **CP-SERV-VENTA-005** | `unit/ventaService.test.js` | Rechaza orden con productos duplicados en ítems |
| **CP-SERV-VENTA-006** | `unit/ventaService.test.js` | Rechaza venta por stock insuficiente (Análisis de Valor Límite: stock 5, pide 6) |
| **CP-SERV-VENTA-007** | `unit/ventaService.test.js` | Venta válida en valor límite de stock (stock 5, pide exactamente 5) |
| **CP-SERV-VENTA-008** | `unit/ventaService.test.js` | Realiza ROLLBACK si ocurre un error durante la transacción |
| **CP-SERV-VENTA-009** | `unit/ventaService.test.js` | Anula venta completada y restituye el stock de los productos |
| **CP-SERV-VENTA-010** | `unit/ventaService.test.js` | Rechaza anular una venta que ya está en estado ANULADA |
