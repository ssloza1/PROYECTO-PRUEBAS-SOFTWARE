
-- ==================================================
-- SISTEMA DE INVENTARIO Y VENTAS
-- Archivo: database/01_schema.sql
-- ==================================================

CREATE TABLE public.proveedores (
    id_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.categorias (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE public.productos (
    id_producto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 0
        CHECK (stock_minimo >= 0),

    id_proveedor INTEGER NOT NULL
        REFERENCES public.proveedores(id_proveedor),

    id_categoria INTEGER NOT NULL
        REFERENCES public.categorias(id_categoria),

    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.clientes (
    id_cliente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.ventas (
    id_venta INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_cliente INTEGER NOT NULL
        REFERENCES public.clientes(id_cliente),

    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (total >= 0),

    estado VARCHAR(15) NOT NULL DEFAULT 'COMPLETADA'
        CHECK (estado IN ('COMPLETADA', 'ANULADA'))
);

CREATE TABLE public.detalle_venta (
    id_detalle INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_venta INTEGER NOT NULL
        REFERENCES public.ventas(id_venta),

    id_producto INTEGER NOT NULL
        REFERENCES public.productos(id_producto),

    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    precio_unitario NUMERIC(12,2) NOT NULL
        CHECK (precio_unitario >= 0),

    subtotal NUMERIC(12,2)
        GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

    UNIQUE (id_venta, id_producto)
);

-- Índices para mejorar las consultas relacionadas

CREATE INDEX idx_productos_proveedor
    ON public.productos(id_proveedor);

CREATE INDEX idx_productos_categoria
    ON public.productos(id_categoria);

CREATE INDEX idx_ventas_cliente
    ON public.ventas(id_cliente);

CREATE INDEX idx_ventas_fecha
    ON public.ventas(fecha);

CREATE INDEX idx_detalle_producto
    ON public.detalle_venta(id_producto);
