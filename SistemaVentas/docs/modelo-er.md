# Modelo entidad-relación

## Sistema de inventario y ventas

### Tablas

- proveedores
- categorias
- productos
- clientes
- ventas
- detalle_venta

### Relaciones

- Un proveedor puede suministrar muchos productos.
- Una categoría puede contener muchos productos.
- Un cliente puede tener muchas ventas.
- Una venta puede contener varios detalles.
- Un producto puede aparecer en muchos detalles de venta.

### Claves principales

Cada tabla tiene una clave primaria que identifica sus registros.

### Claves foráneas

- productos.id_proveedor
- productos.id_categoria
- ventas.id_cliente
- detalle_venta.id_venta
- detalle_venta.id_producto