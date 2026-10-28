/**
 * Repositorios falsos en memoria para las pruebas de API (Supertest).
 *
 * Reemplazan a los repositorios reales (que consultan PostgreSQL/Supabase) para que
 * las pruebas sean rápidas, repetibles y no dependan de internet ni de datos reales.
 * Es el mismo principio del Lab 2: "simular una base de datos con un arreglo en memoria".
 *
 * Uso en un archivo de pruebas:
 *   jest.mock('../../src/repositories/productoRepository', () => require('../helpers/fakeRepositories').productoRepository);
 *   beforeEach(() => require('../helpers/fakeRepositories').reset());
 */
const store = {};
const seq = {};

function copy(obj) {
  return obj ? { ...obj } : null;
}

function nextId(nombre) {
  seq[nombre] += 1;
  return seq[nombre];
}

/** Restablece los datos de ejemplo. Se llama antes de cada prueba para aislar el estado. */
function reset() {
  store.categorias = [{ id_categoria: 1, nombre: 'Tecnología', descripcion: null }];
  store.proveedores = [
    { id_proveedor: 1, nombre: 'Distribuidora Central', telefono: null, correo: null, direccion: null, activo: true },
    { id_proveedor: 2, nombre: 'Proveedor Inactivo', telefono: null, correo: null, direccion: null, activo: false },
  ];
  store.productos = [
    { id_producto: 1, nombre: 'Teclado USB', descripcion: 'Teclado básico', precio: 15.5, stock: 20, stock_minimo: 5, id_proveedor: 1, id_categoria: 1, activo: true },
    { id_producto: 2, nombre: 'Ratón USB', descripcion: null, precio: 8.25, stock: 5, stock_minimo: 5, id_proveedor: 1, id_categoria: 1, activo: true },
    { id_producto: 3, nombre: 'Monitor agotado', descripcion: null, precio: 145, stock: 0, stock_minimo: 2, id_proveedor: 1, id_categoria: 1, activo: true },
    { id_producto: 4, nombre: 'Cable descontinuado', descripcion: null, precio: 3, stock: 10, stock_minimo: 1, id_proveedor: 1, id_categoria: 1, activo: false },
  ];
  store.clientes = [
    { id_cliente: 1, nombre: 'Ana Pérez', cedula: 'TEST-CLI-001', telefono: null, correo: 'ana@correo.com', direccion: null, activo: true },
    { id_cliente: 2, nombre: 'Luis Inactivo', cedula: 'TEST-CLI-002', telefono: null, correo: null, direccion: null, activo: false },
  ];
  store.ventas = [];
  store.detalles = [];
  seq.categorias = 1;
  seq.proveedores = 2;
  seq.productos = 4;
  seq.clientes = 2;
  seq.ventas = 0;
  seq.detalles = 0;
}

reset();

// ---------------------------------------------------------------- Productos
const productoRepository = {
  async findAll(filtros = {}) {
    let lista = store.productos.map(copy);
    if (filtros.activo !== undefined) lista = lista.filter((p) => p.activo === filtros.activo);
    if (filtros.id_categoria) lista = lista.filter((p) => p.id_categoria === filtros.id_categoria);
    if (filtros.stock_bajo === true) lista = lista.filter((p) => p.stock <= p.stock_minimo);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      lista = lista.filter((p) => p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q));
    }
    return lista;
  },
  async findById(id) {
    return copy(store.productos.find((p) => p.id_producto === id));
  },
  async create(data) {
    const nuevo = { id_producto: nextId('productos'), ...data };
    store.productos.push(nuevo);
    return copy(nuevo);
  },
  async update(id, data) {
    const p = store.productos.find((x) => x.id_producto === id);
    if (!p) return null;
    // Igual que COALESCE en SQL: solo cambia lo que viene definido
    Object.keys(data).forEach((k) => {
      if (data[k] !== undefined && data[k] !== null) p[k] = data[k];
    });
    return copy(p);
  },
  async updateStock(id, delta) {
    const p = store.productos.find((x) => x.id_producto === id);
    if (!p || p.stock + delta < 0) return null;
    p.stock += delta;
    return { id_producto: p.id_producto, nombre: p.nombre, stock: p.stock };
  },
  async softDelete(id) {
    const p = store.productos.find((x) => x.id_producto === id);
    if (!p) return null;
    p.activo = false;
    return { id_producto: p.id_producto, nombre: p.nombre, activo: p.activo };
  },
};

// ----------------------------------------------------------------- Clientes
const clienteRepository = {
  async findAll(filtros = {}) {
    let lista = store.clientes.map(copy);
    if (filtros.activo !== undefined) lista = lista.filter((c) => c.activo === filtros.activo);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      lista = lista.filter((c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.cedula.toLowerCase().includes(q) ||
        (c.correo || '').toLowerCase().includes(q));
    }
    return lista;
  },
  async findById(id) {
    return copy(store.clientes.find((c) => c.id_cliente === id));
  },
  async findByCedula(cedula) {
    return copy(store.clientes.find((c) => c.cedula === cedula));
  },
  async create(data) {
    const nuevo = { id_cliente: nextId('clientes'), ...data };
    store.clientes.push(nuevo);
    return copy(nuevo);
  },
  async update(id, data) {
    const c = store.clientes.find((x) => x.id_cliente === id);
    if (!c) return null;
    ['nombre', 'telefono', 'correo', 'direccion', 'activo'].forEach((k) => {
      if (data[k] !== undefined && data[k] !== null) c[k] = data[k];
    });
    return copy(c);
  },
  async softDelete(id) {
    const c = store.clientes.find((x) => x.id_cliente === id);
    if (!c) return null;
    c.activo = false;
    return { id_cliente: c.id_cliente, nombre: c.nombre, activo: c.activo };
  },
};

// ---------------------------------------------------------------- Catálogos
const catalogoRepository = {
  async findAllCategorias() {
    return store.categorias.map(copy);
  },
  async findCategoriaById(id) {
    return copy(store.categorias.find((c) => c.id_categoria === id));
  },
  async createCategoria(data) {
    const nueva = { id_categoria: nextId('categorias'), nombre: data.nombre, descripcion: data.descripcion || null };
    store.categorias.push(nueva);
    return copy(nueva);
  },
  async findAllProveedores(filtros = {}) {
    let lista = store.proveedores.map(copy);
    if (filtros.activo !== undefined) lista = lista.filter((p) => p.activo === filtros.activo);
    return lista;
  },
  async findProveedorById(id) {
    return copy(store.proveedores.find((p) => p.id_proveedor === id));
  },
  async createProveedor(data) {
    const nuevo = { id_proveedor: nextId('proveedores'), ...data };
    store.proveedores.push(nuevo);
    return copy(nuevo);
  },
};

// ------------------------------------------------------------------- Ventas
const ventaRepository = {
  async findAll(filtros = {}) {
    let lista = store.ventas.map((v) => {
      const cliente = store.clientes.find((c) => c.id_cliente === v.id_cliente);
      return {
        ...v,
        nombre_cliente: cliente.nombre,
        cedula_cliente: cliente.cedula,
        cantidad_items: store.detalles.filter((d) => d.id_venta === v.id_venta).length,
      };
    });
    if (filtros.id_cliente) lista = lista.filter((v) => v.id_cliente === filtros.id_cliente);
    if (filtros.estado) lista = lista.filter((v) => v.estado === filtros.estado);
    return lista.reverse();
  },
  async findByIdWithDetails(id) {
    const v = store.ventas.find((x) => x.id_venta === id);
    if (!v) return null;
    const cliente = store.clientes.find((c) => c.id_cliente === v.id_cliente);
    const detalles = store.detalles
      .filter((d) => d.id_venta === id)
      .map((d) => ({
        ...d,
        nombre_producto: store.productos.find((p) => p.id_producto === d.id_producto).nombre,
      }));
    return { ...v, nombre_cliente: cliente.nombre, cedula_cliente: cliente.cedula, detalles };
  },
  async createHeader(data) {
    const nueva = {
      id_venta: nextId('ventas'),
      id_cliente: data.id_cliente,
      fecha: new Date().toISOString(),
      total: data.total,
      estado: data.estado || 'COMPLETADA',
    };
    store.ventas.push(nueva);
    return copy(nueva);
  },
  async createDetail(data) {
    const nuevo = {
      id_detalle: nextId('detalles'),
      id_venta: data.id_venta,
      id_producto: data.id_producto,
      cantidad: data.cantidad,
      precio_unitario: data.precio_unitario,
      subtotal: Math.round(data.cantidad * data.precio_unitario * 100) / 100,
    };
    store.detalles.push(nuevo);
    return copy(nuevo);
  },
  async updateStatus(id, nuevoEstado) {
    const v = store.ventas.find((x) => x.id_venta === id);
    if (!v) return null;
    v.estado = nuevoEstado;
    return { id_venta: v.id_venta, id_cliente: v.id_cliente, total: v.total, estado: v.estado };
  },
  async findDetailsByVentaId(idVenta) {
    return store.detalles.filter((d) => d.id_venta === idVenta).map(copy);
  },
};

// --------------------------------------------------- Módulo db (simulado)
const clientFalso = {
  query: jest.fn().mockResolvedValue({ rows: [] }),
  release: jest.fn(),
};

const db = {
  query: jest.fn(),
  getClient: jest.fn().mockResolvedValue(clientFalso),
  closePool: jest.fn().mockResolvedValue(true),
  clientFalso,
};

module.exports = {
  store,
  reset,
  productoRepository,
  clienteRepository,
  catalogoRepository,
  ventaRepository,
  db,
};
