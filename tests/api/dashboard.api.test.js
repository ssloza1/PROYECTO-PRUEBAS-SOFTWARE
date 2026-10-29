// Pruebas de validación de /api/dashboard/metricas.
// El controlador consulta directamente el módulo db, por eso aquí se simulan sus 4 consultas SQL.
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

describe('API - /api/dashboard/metricas', () => {
  beforeEach(() => db.query.mockReset());

  test('CP-API-DASH-001: devuelve las métricas consolidadas con estado 200', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_ventas: 3, total_ingresos: 120.5, total_anuladas: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total_productos: 4, productos_agotados: 1, productos_stock_bajo: 1, valor_inventario: 500 }] })
      .mockResolvedValueOnce({ rows: [{ total_clientes: 2, clientes_activos: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id_venta: 3, nombre_cliente: 'Ana Pérez', total: 40.62, estado: 'COMPLETADA' }] });

    const res = await request(app).get('/api/dashboard/metricas');

    expect(res.statusCode).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.datos.ventas.total_ventas).toBe(3);
    expect(res.body.datos.inventario.productos_agotados).toBe(1);
    expect(res.body.datos.clientes.clientes_activos).toBe(1);
    expect(res.body.datos.ultimas_ventas).toHaveLength(1);
    expect(db.query).toHaveBeenCalledTimes(4);
  });

  test('CP-API-DASH-002: si la base de datos falla responde 500 con exito=false', async () => {
    db.query.mockRejectedValueOnce(new Error('Conexión rechazada por la base de datos'));

    const res = await request(app).get('/api/dashboard/metricas');

    expect(res.statusCode).toBe(500);
    expect(res.body.exito).toBe(false);
    expect(res.body.error).toBe('Conexión rechazada por la base de datos');
  });
});
