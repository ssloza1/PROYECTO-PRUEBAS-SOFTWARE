// Pruebas unitarias de los repositorios: se comprueba que cada método arme la consulta SQL
// correcta (filtros, parámetros) y devuelva lo esperado. El módulo db se simula: no hay conexión real.
jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

const db = require('../../src/config/db');
const catalogoRepo = require('../../src/repositories/catalogoRepository');
const clienteRepo = require('../../src/repositories/clienteRepository');
const productoRepo = require('../../src/repositories/productoRepository');
const ventaRepo = require('../../src/repositories/ventaRepository');

/** Cliente de transacción falso, usado para comprobar que se prefiere sobre db cuando se entrega */
function crearClient(rows = []) {
  return { query: jest.fn().mockResolvedValue({ rows }) };
}

describe('Pruebas Unitarias - Repositorios (SQL y parámetros)', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.query.mockResolvedValue({ rows: [] });
  });

  describe('catalogoRepository', () => {
    test('CP-REPO-CAT-001: findAllCategorias consulta la tabla categorias ordenada', async () => {
      db.query.mockResolvedValue({ rows: [{ id_categoria: 1 }] });

      const res = await catalogoRepo.findAllCategorias();

      expect(res).toEqual([{ id_categoria: 1 }]);
      expect(db.query.mock.calls[0][0]).toContain('FROM public.categorias');
    });

    test('CP-REPO-CAT-002: usa el client de transacción cuando se entrega', async () => {
      const client = crearClient([{ id_categoria: 3 }]);

      const res = await catalogoRepo.findAllCategorias(client);

      expect(res).toEqual([{ id_categoria: 3 }]);
      expect(client.query).toHaveBeenCalledTimes(1);
      expect(db.query).not.toHaveBeenCalled();
    });

    test('CP-REPO-CAT-003: findCategoriaById devuelve la fila o null', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_categoria: 1 }] }).mockResolvedValueOnce({ rows: [] });

      expect(await catalogoRepo.findCategoriaById(1)).toEqual({ id_categoria: 1 });
      expect(await catalogoRepo.findCategoriaById(99)).toBeNull();
      expect(db.query.mock.calls[0][1]).toEqual([1]);
    });

    test('CP-REPO-CAT-004: createCategoria inserta y devuelve la fila (descripción null por defecto)', async () => {
      db.query.mockResolvedValue({ rows: [{ id_categoria: 5, nombre: 'Redes' }] });

      const res = await catalogoRepo.createCategoria({ nombre: 'Redes' });

      expect(res.id_categoria).toBe(5);
      expect(db.query.mock.calls[0][0]).toContain('INSERT INTO public.categorias');
      expect(db.query.mock.calls[0][1]).toEqual(['Redes', null]);
    });

    test('CP-REPO-CAT-005: findAllProveedores aplica el filtro activo solo si se envía', async () => {
      await catalogoRepo.findAllProveedores();
      await catalogoRepo.findAllProveedores({ activo: false });

      expect(db.query.mock.calls[0][0]).not.toContain('AND activo');
      expect(db.query.mock.calls[0][1]).toEqual([]);
      expect(db.query.mock.calls[1][0]).toContain('AND activo = $1');
      expect(db.query.mock.calls[1][1]).toEqual([false]);
    });

    test('CP-REPO-CAT-006: findProveedorById devuelve la fila o null', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_proveedor: 1 }] }).mockResolvedValueOnce({ rows: [] });

      expect(await catalogoRepo.findProveedorById(1)).toEqual({ id_proveedor: 1 });
      expect(await catalogoRepo.findProveedorById(99)).toBeNull();
    });

    test('CP-REPO-CAT-007: createProveedor usa null y activo=true por defecto, o los valores enviados', async () => {
      db.query.mockResolvedValue({ rows: [{ id_proveedor: 9 }] });

      await catalogoRepo.createProveedor({ nombre: 'Mínimo SA' });
      await catalogoRepo.createProveedor({ nombre: 'Tecno', telefono: '022', correo: 'a@b.com', direccion: 'Quito', activo: false });

      expect(db.query.mock.calls[0][1]).toEqual(['Mínimo SA', null, null, null, true]);
      expect(db.query.mock.calls[1][1]).toEqual(['Tecno', '022', 'a@b.com', 'Quito', false]);
    });
  });

  describe('clienteRepository', () => {
    test('CP-REPO-CLI-001: findAll sin filtros no agrega condiciones', async () => {
      await clienteRepo.findAll();

      expect(db.query.mock.calls[0][0]).not.toContain('AND activo');
      expect(db.query.mock.calls[0][0]).not.toContain('ILIKE');
      expect(db.query.mock.calls[0][1]).toEqual([]);
    });

    test('CP-REPO-CLI-002: findAll con filtros activo y búsqueda arma los parámetros en orden', async () => {
      await clienteRepo.findAll({ activo: true, busqueda: 'ana' });

      expect(db.query.mock.calls[0][0]).toContain('AND activo = $1');
      expect(db.query.mock.calls[0][0]).toContain('ILIKE $2');
      expect(db.query.mock.calls[0][1]).toEqual([true, '%ana%']);
    });

    test('CP-REPO-CLI-003: findAll usa el client de transacción cuando se entrega', async () => {
      const client = crearClient();

      await clienteRepo.findAll({}, client);

      expect(client.query).toHaveBeenCalledTimes(1);
      expect(db.query).not.toHaveBeenCalled();
    });

    test('CP-REPO-CLI-004: findById y findByCedula devuelven la fila o null', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_cliente: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ cedula: 'TEST-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      expect(await clienteRepo.findById(1)).toEqual({ id_cliente: 1 });
      expect(await clienteRepo.findById(2)).toBeNull();
      expect(await clienteRepo.findByCedula('TEST-1')).toEqual({ cedula: 'TEST-1' });
      expect(await clienteRepo.findByCedula('X')).toBeNull();
    });

    test('CP-REPO-CLI-005: create guarda null por defecto y activo=true si no se indica', async () => {
      db.query.mockResolvedValue({ rows: [{ id_cliente: 4 }] });

      await clienteRepo.create({ nombre: 'Ana', cedula: 'TEST-1' });
      await clienteRepo.create({ nombre: 'Luis', cedula: 'TEST-2', telefono: '1', correo: 'l@l.com', direccion: 'Q', activo: false });

      expect(db.query.mock.calls[0][1]).toEqual(['Ana', 'TEST-1', null, null, null, true]);
      expect(db.query.mock.calls[1][1]).toEqual(['Luis', 'TEST-2', '1', 'l@l.com', 'Q', false]);
    });

    test('CP-REPO-CLI-006: update envía los campos y el ID al final; devuelve null si no existe', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_cliente: 1 }] }).mockResolvedValueOnce({ rows: [] });

      expect(await clienteRepo.update(1, { nombre: 'Ana', telefono: '1', correo: 'a@a.com', direccion: 'Q', activo: true })).toEqual({ id_cliente: 1 });
      expect(await clienteRepo.update(9, {})).toBeNull();
      expect(db.query.mock.calls[0][1]).toEqual(['Ana', '1', 'a@a.com', 'Q', true, 1]);
    });

    test('CP-REPO-CLI-007: softDelete marca activo = FALSE; devuelve null si no existe', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_cliente: 1, activo: false }] }).mockResolvedValueOnce({ rows: [] });

      expect(await clienteRepo.softDelete(1)).toEqual({ id_cliente: 1, activo: false });
      expect(await clienteRepo.softDelete(9)).toBeNull();
      expect(db.query.mock.calls[0][0]).toContain('activo = FALSE');
    });
  });

  describe('productoRepository', () => {
    test('CP-REPO-PROD-001: findAll sin filtros no agrega condiciones', async () => {
      await productoRepo.findAll();

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toContain('AND p.activo');
      expect(sql).not.toContain('AND p.id_categoria');
      expect(sql).not.toContain('p.stock <= p.stock_minimo');
      expect(sql).not.toContain('ILIKE');
      expect(db.query.mock.calls[0][1]).toEqual([]);
    });

    test('CP-REPO-PROD-002: findAll con todos los filtros arma SQL y parámetros en orden', async () => {
      await productoRepo.findAll({ activo: true, id_categoria: 2, stock_bajo: true, busqueda: 'mouse' });

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('p.activo = $1');
      expect(sql).toContain('p.id_categoria = $2');
      expect(sql).toContain('p.stock <= p.stock_minimo');
      expect(sql).toContain('ILIKE $3');
      expect(params).toEqual([true, 2, '%mouse%']);
    });

    test('CP-REPO-PROD-003: findAll usa el client de transacción cuando se entrega', async () => {
      const client = crearClient([{ id_producto: 1 }]);

      expect(await productoRepo.findAll({}, client)).toEqual([{ id_producto: 1 }]);
      expect(db.query).not.toHaveBeenCalled();
    });

    test('CP-REPO-PROD-004: findById devuelve la fila o null y usa client si se entrega', async () => {
      const client = crearClient([{ id_producto: 1 }]);
      db.query.mockResolvedValueOnce({ rows: [{ id_producto: 1 }] }).mockResolvedValueOnce({ rows: [] });

      expect(await productoRepo.findById(1)).toEqual({ id_producto: 1 });
      expect(await productoRepo.findById(9)).toBeNull();
      expect(await productoRepo.findById(1, client)).toEqual({ id_producto: 1 });
      expect(client.query).toHaveBeenCalledTimes(1);
    });

    test('CP-REPO-PROD-005: create aplica valores por defecto (descripción null, stock 0, activo true)', async () => {
      db.query.mockResolvedValue({ rows: [{ id_producto: 8 }] });

      await productoRepo.create({ nombre: 'Cable', precio: 3, id_proveedor: 1, id_categoria: 1 });
      await productoRepo.create({
        nombre: 'Monitor', descripcion: 'HD', precio: 145, stock: 10, stock_minimo: 2, id_proveedor: 1, id_categoria: 1, activo: false,
      });

      expect(db.query.mock.calls[0][1]).toEqual(['Cable', null, 3, 0, 0, 1, 1, true]);
      expect(db.query.mock.calls[1][1]).toEqual(['Monitor', 'HD', 145, 10, 2, 1, 1, false]);
    });

    test('CP-REPO-PROD-006: update envía los campos y el ID al final; devuelve null si no existe', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_producto: 1 }] }).mockResolvedValueOnce({ rows: [] });

      expect(await productoRepo.update(1, { nombre: 'N', precio: 5 })).toEqual({ id_producto: 1 });
      expect(await productoRepo.update(9, {})).toBeNull();
      expect(db.query.mock.calls[0][1]).toEqual(['N', undefined, 5, undefined, undefined, undefined, undefined, undefined, 1]);
    });

    test('CP-REPO-PROD-007: updateStock suma o resta y protege contra stock negativo (WHERE stock + delta >= 0)', async () => {
      const client = crearClient([{ id_producto: 1, stock: 18 }]);

      const res = await productoRepo.updateStock(1, -2, client);

      expect(res).toEqual({ id_producto: 1, stock: 18 });
      expect(client.query.mock.calls[0][0]).toContain('(stock + $1) >= 0');
      expect(client.query.mock.calls[0][1]).toEqual([-2, 1]);
    });

    test('CP-REPO-PROD-008: updateStock devuelve null cuando el stock quedaría negativo (sin filas)', async () => {
      expect(await productoRepo.updateStock(1, -999)).toBeNull();
    });

    test('CP-REPO-PROD-009: softDelete marca activo = FALSE; devuelve null si no existe', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_producto: 1, activo: false }] }).mockResolvedValueOnce({ rows: [] });

      expect(await productoRepo.softDelete(1)).toEqual({ id_producto: 1, activo: false });
      expect(await productoRepo.softDelete(9)).toBeNull();
    });
  });

  describe('ventaRepository', () => {
    test('CP-REPO-VENT-001: findAll sin filtros no agrega condiciones', async () => {
      await ventaRepo.findAll();

      expect(db.query.mock.calls[0][0]).not.toContain('AND v.id_cliente');
      expect(db.query.mock.calls[0][0]).not.toContain('AND v.estado');
      expect(db.query.mock.calls[0][1]).toEqual([]);
    });

    test('CP-REPO-VENT-002: findAll con filtros id_cliente y estado', async () => {
      await ventaRepo.findAll({ id_cliente: 3, estado: 'ANULADA' });

      expect(db.query.mock.calls[0][0]).toContain('v.id_cliente = $1');
      expect(db.query.mock.calls[0][0]).toContain('v.estado = $2');
      expect(db.query.mock.calls[0][1]).toEqual([3, 'ANULADA']);
    });

    test('CP-REPO-VENT-003: findByIdWithDetails devuelve null si la venta no existe (sin consultar detalles)', async () => {
      expect(await ventaRepo.findByIdWithDetails(9)).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('CP-REPO-VENT-004: findByIdWithDetails une la cabecera con sus detalles', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_venta: 5, estado: 'COMPLETADA' }] })
        .mockResolvedValueOnce({ rows: [{ id_detalle: 1 }, { id_detalle: 2 }] });

      const res = await ventaRepo.findByIdWithDetails(5);

      expect(res.id_venta).toBe(5);
      expect(res.detalles).toHaveLength(2);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('CP-REPO-VENT-005: createHeader inserta con estado por defecto COMPLETADA', async () => {
      const client = crearClient([{ id_venta: 1 }]);

      await ventaRepo.createHeader({ id_cliente: 1, total: 10 }, client);
      await ventaRepo.createHeader({ id_cliente: 1, total: 10, estado: 'ANULADA' }, client);

      expect(client.query.mock.calls[0][1]).toEqual([1, 10, 'COMPLETADA']);
      expect(client.query.mock.calls[1][1]).toEqual([1, 10, 'ANULADA']);
    });

    test('CP-REPO-VENT-006: createDetail inserta el detalle y devuelve la fila', async () => {
      const client = crearClient([{ id_detalle: 1 }]);

      const res = await ventaRepo.createDetail({ id_venta: 1, id_producto: 2, cantidad: 3, precio_unitario: 4.5 }, client);

      expect(res).toEqual({ id_detalle: 1 });
      expect(client.query.mock.calls[0][1]).toEqual([1, 2, 3, 4.5]);
    });

    test('CP-REPO-VENT-007: updateStatus cambia el estado; devuelve null si no existe', async () => {
      const client = crearClient([{ id_venta: 1, estado: 'ANULADA' }]);
      const vacio = crearClient([]);

      expect(await ventaRepo.updateStatus(1, 'ANULADA', client)).toEqual({ id_venta: 1, estado: 'ANULADA' });
      expect(await ventaRepo.updateStatus(9, 'ANULADA', vacio)).toBeNull();
      expect(client.query.mock.calls[0][1]).toEqual(['ANULADA', 1]);
    });

    test('CP-REPO-VENT-008: findDetailsByVentaId consulta por venta con db o con client', async () => {
      const client = crearClient([{ id_detalle: 1 }]);
      db.query.mockResolvedValue({ rows: [{ id_detalle: 9 }] });

      expect(await ventaRepo.findDetailsByVentaId(5)).toEqual([{ id_detalle: 9 }]);
      expect(await ventaRepo.findDetailsByVentaId(5, client)).toEqual([{ id_detalle: 1 }]);
      expect(db.query.mock.calls[0][1]).toEqual([5]);
    });
  });
});
