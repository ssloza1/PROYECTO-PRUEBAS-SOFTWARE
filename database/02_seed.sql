
-- ==================================================
-- DATOS DE PRUEBA
-- Archivo: database/02_seed.sql
-- Ejecutar una sola vez en una base vacía
-- ==================================================

INSERT INTO public.proveedores
    (nombre, telefono, correo)
VALUES
    ('Distribuidora Central', '0991112233',
     'central@example.com'),
    ('Tecnología Andina', '0982223344',
     'andina@example.com');

INSERT INTO public.categorias
    (nombre, descripcion)
VALUES
    ('Tecnología', 'Equipos electrónicos y accesorios'),
    ('Oficina', 'Productos para oficina');

INSERT INTO public.productos (
    nombre,
    descripcion,
    precio,
    stock,
    stock_minimo,
    id_proveedor,
    id_categoria
)
VALUES
    ('Teclado USB', 'Teclado estándar',
     15.50, 20, 5, 1, 1),
    ('Ratón USB', 'Ratón óptico',
     8.25, 30, 5, 2, 1);

INSERT INTO public.clientes (
    nombre,
    cedula,
    telefono,
    correo
)
VALUES
    ('Ana Pérez', 'TEST-CLI-001',
     '0993334455', 'ana@example.com');
