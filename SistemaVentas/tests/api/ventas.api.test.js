// Pruebas de validación de /api/ventas con Supertest.
// Incluye el "flujo completo" del Lab 2 (Actividad 1): crear datos con POST y comprobar con GET,
// usando almacenamiento en memoria en lugar de la base de datos real.
jest.mock('../../src/repositories/productoRepository', () => require('../helpers/fakeRepositories').productoRepository);
jest.mock('../../src/repositories/clienteRepository', () => require('../helpers/fakeRepositories').clienteRepository);
jest.mock('../../src/repositories/ventaRepository', () => require('../helpers/fakeRepositories').ventaRepository);
jest.mock('../../src/repositories/catalogoRepository', () => require('../helpers/fakeRepositories').catalogoRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const { reset, db } = require('../helpers/fakeRepositories');

async function stockDe(idProducto) {
  const res = await request(app).get(`/api/productos/${idProducto}`);
  return res.body.datos.stock;
}

describe('API - /api/ventas', () => {
  beforeEach(() => {
    reset();
    db.getClient.mockClear();
    db.clientFalso.query.mockClear();
    db.clientFalso.release.mockClear();
  });

  describe('POST /api/ventas (registrar)', () => {
    test('CP-API-VENT-001: registra una venta válida, calcula totales y responde 201', async () => {
      const res = await request(app).post('/api/ventas').send({
        id_cliente: 1,
        items: [
          { id_producto: 1, cantidad: 2 }, // 2 x 15.50 = 31.00
          { id_producto: 2, cantidad: 1 }, // 1 x 8.25  =  8.25
        ],
        porcentajeIVA: 15,
        porcentajeDescuento: 10,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos.estado).toBe('COMPLETADA');
      expect(res.body.datos.cliente.nombre).toBe('Ana Pérez');
      expect(res.body.datos.detalles).toHaveLength(2);
      // subtotal 39.25 - descuento 3.93 = base 35.32; IVA 15% = 5.30; total = 40.62
      expect(res.body.datos.totales).toEqual({
        subtotal: 39.25,
        descuento: 3.93,
        iva: 5.3,
        total: 40.62,
        totalItems: 3,
      });
      expect(res.body.datos.total).toBe(40.62);
    });

    test('CP-API-VENT-002: la venta descuenta stock y usa una transacción BEGIN -> COMMIT (RN-VENTA-04)', async () => {
      await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 1, cantidad: 2 }] });

      expect(await stockDe(1)).toBe(18);
      const llamadas = db.clientFalso.query.mock.calls.map((c) => c[0]);
      expect(llamadas).toEqual(['BEGIN', 'COMMIT']);
      expect(db.clientFalso.release).toHaveBeenCalledTimes(1);
    });

    test('CP-API-VENT-003: flujo completo - POST y luego GET (lista y detalle) - Actividad 1 del lab', async () => {
      const antes = (await request(app).get('/api/ventas')).body.total;

      const u1 = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1 }] });
      const u2 = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 2, cantidad: 2 }] });
      const lista = await request(app).get('/api/ventas');
      const detalle = await request(app).get(`/api/ventas/${u1.body.datos.id_venta}`);

      expect(lista.body.total).toBe(antes + 2);
      expect(lista.body.datos.map((v) => v.id_venta)).toEqual([u2.body.datos.id_venta, u1.body.datos.id_venta]);
      expect(detalle.statusCode).toBe(200);
      expect(detalle.body.datos.detalles).toHaveLength(1);
      expect(detalle.body.datos.detalles[0].nombre_producto).toBe('Teclado USB');
    });

    test('CP-API-VENT-004: valor límite - stock 5 y se piden exactamente 5 -> venta válida y stock en 0', async () => {
      const res = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 2, cantidad: 5 }] });

      expect(res.statusCode).toBe(201);
      expect(await stockDe(2)).toBe(0);
    });

    test('CP-API-VENT-005: valor límite - stock 5 y se piden 6 -> 400 y el stock no cambia (RN-VENTA-03)', async () => {
      const res = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 2, cantidad: 6 }] });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Stock insuficiente');
      expect(await stockDe(2)).toBe(5);
      expect(db.getClient).not.toHaveBeenCalled(); // no se abrió ninguna transacción
    });

    test('CP-API-VENT-006: rechaza ventas inválidas con 400 y mensaje (particiones de equivalencia inválidas)', async () => {
      const itemOk = [{ id_producto: 1, cantidad: 1 }];
      const casos = [
        [{ items: itemOk }, 'ID de cliente válido'],
        [{ id_cliente: 'abc', items: itemOk }, 'ID de cliente válido'],
        [{ id_cliente: 999, items: itemOk }, 'cliente con ID 999 no existe'],
        [{ id_cliente: 2, items: itemOk }, 'inactivo'],
        [{ id_cliente: 1, items: [] }, 'al menos un producto'],
        [{ id_cliente: 1 }, 'al menos un producto'],
        [{ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1 }, { id_producto: 1, cantidad: 2 }] }, 'duplicado'],
        [{ id_cliente: 1, items: [{ id_producto: 999, cantidad: 1 }] }, 'producto con ID 999 no existe'],
        [{ id_cliente: 1, items: [{ id_producto: 4, cantidad: 1 }] }, 'inactivo'],
        [{ id_cliente: 1, items: [{ id_producto: 3, cantidad: 1 }] }, 'Stock insuficiente'],
        [{ id_cliente: 1, items: [{ id_producto: 0, cantidad: 1 }] }, 'ID de producto válido'],
        [{ id_cliente: 1, items: [{ id_producto: 1, cantidad: 0 }] }, 'entero mayor a cero'],
        [{ id_cliente: 1, items: [{ id_producto: 1, cantidad: -2 }] }, 'entero mayor a cero'],
        [{ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1.5 }] }, 'entero mayor a cero'],
        [{ id_cliente: 1, items: itemOk, porcentajeIVA: 150 }, 'IVA debe estar entre 0 y 100'],
        [{ id_cliente: 1, items: itemOk, porcentajeDescuento: -5 }, 'descuento debe estar entre 0 y 100'],
      ];

      for (const [cuerpo, mensaje] of casos) {
        const res = await request(app).post('/api/ventas').send(cuerpo);
        expect(res.statusCode).toBe(400);
        expect(res.body.exito).toBe(false);
        expect(res.body.error).toContain(mensaje);
      }
      // Ninguna de las ventas inválidas llegó a modificar el inventario
      expect(await stockDe(1)).toBe(20);
    });
  });

  describe('GET /api/ventas (listar y detallar)', () => {
    test('CP-API-VENT-007: la lista vacía inicial responde 200 con total 0', async () => {
      const res = await request(app).get('/api/ventas');

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.datos).toEqual([]);
    });

    test('CP-API-VENT-008: filtros ?id_cliente= y ?estado= (se convierte a mayúsculas)', async () => {
      const venta = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1 }] });
      await request(app).post(`/api/ventas/${venta.body.datos.id_venta}/anular`);
      await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1 }] });

      const anuladas = await request(app).get('/api/ventas?estado=anulada');
      const completadas = await request(app).get('/api/ventas?estado=COMPLETADA');
      const delCliente = await request(app).get('/api/ventas?id_cliente=1');
      const deOtroCliente = await request(app).get('/api/ventas?id_cliente=2');

      expect(anuladas.body.total).toBe(1);
      expect(completadas.body.total).toBe(1);
      expect(delCliente.body.total).toBe(2);
      expect(deOtroCliente.body.total).toBe(0);
    });

    test('CP-API-VENT-009: GET /api/ventas/:id con ID inválido responde 400', async () => {
      const res = await request(app).get('/api/ventas/abc');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('ID de venta inválido');
    });
  });

  describe('POST /api/ventas/:id/anular', () => {
    test('CP-API-VENT-010: anula la venta y repone el stock (RN-VENTA-07)', async () => {
      const venta = await request(app).post('/api/ventas').send({
        id_cliente: 1,
        items: [{ id_producto: 1, cantidad: 4 }, { id_producto: 2, cantidad: 3 }],
      });
      expect(await stockDe(1)).toBe(16);
      expect(await stockDe(2)).toBe(2);

      const res = await request(app).post(`/api/ventas/${venta.body.datos.id_venta}/anular`);

      expect(res.statusCode).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.mensaje).toContain('anulada exitosamente');
      expect(res.body.datos.estado).toBe('ANULADA');
      expect(await stockDe(1)).toBe(20);
      expect(await stockDe(2)).toBe(5);
    });

    test('CP-API-VENT-011: no permite anular dos veces la misma venta', async () => {
      const venta = await request(app).post('/api/ventas').send({ id_cliente: 1, items: [{ id_producto: 1, cantidad: 1 }] });
      const id = venta.body.datos.id_venta;

      await request(app).post(`/api/ventas/${id}/anular`);
      const segunda = await request(app).post(`/api/ventas/${id}/anular`);

      expect(segunda.statusCode).toBe(400);
      expect(segunda.body.error).toContain('anulada previamente');
      expect(await stockDe(1)).toBe(20); // no se repuso dos veces
    });

    test('CP-API-VENT-012: ID inválido responde 400', async () => {
      const res = await request(app).post('/api/ventas/abc/anular');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('ID de venta inválido');
    });
  });
});
