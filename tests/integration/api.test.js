const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

describe('Pruebas de Integración - API Endpoints (Supertest)', () => {
  afterAll(async () => {
    // Cerrar el pool de conexiones para liberar los handles
    await db.closePool();
  });

  describe('GET /api/health', () => {
    test('CP-INT-001: Devuelve estado 200 y confirmación de servicio UP', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.estado).toBe('UP');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/productos', () => {
    test('CP-INT-002: Lista productos desde la base de datos Supabase con estado 200', async () => {
      const res = await request(app).get('/api/productos');

      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(0);

      if (res.body.datos.length > 0) {
        const prod = res.body.datos[0];
        expect(prod).toHaveProperty('id_producto');
        expect(prod).toHaveProperty('nombre');
        expect(prod).toHaveProperty('precio');
        expect(prod).toHaveProperty('stock');
        expect(prod).toHaveProperty('nivel_stock');
      }
    });
  });

  describe('GET /api/catalogos/categorias y /api/catalogos/proveedores', () => {
    test('CP-INT-003: Obtiene categorías de productos', async () => {
      const res = await request(app).get('/api/catalogos/categorias');
      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
    });

    test('CP-INT-004: Obtiene proveedores registrados', async () => {
      const res = await request(app).get('/api/catalogos/proveedores');
      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
    });
  });

  describe('GET /api/clientes', () => {
    test('CP-INT-005: Lista clientes con código 200', async () => {
      const res = await request(app).get('/api/clientes');
      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
    });
  });

  describe('GET /api/dashboard/metricas', () => {
    test('CP-INT-006: Devuelve métricas consolidadas del sistema', async () => {
      const res = await request(app).get('/api/dashboard/metricas');
      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos).toHaveProperty('ventas');
      expect(res.body.datos).toHaveProperty('inventario');
      expect(res.body.datos).toHaveProperty('clientes');
    });
  });

  describe('Validaciones y Manejo de Errores HTTP (Pruebas Negativas)', () => {
    test('CP-INT-007: POST /api/productos con campos vacíos responde 400 y mensaje explicativo', async () => {
      const res = await request(app)
        .post('/api/productos')
        .send({
          nombre: '',
          precio: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.exito).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    test('CP-INT-008: POST /api/ventas sin cliente responde 400', async () => {
      const res = await request(app)
        .post('/api/ventas')
        .send({
          items: [{ id_producto: 1, cantidad: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.exito).toBe(false);
    });

    test('CP-INT-009: POST /api/ventas con stock insuficiente responde 400 con detalle', async () => {
      const res = await request(app)
        .post('/api/ventas')
        .send({
          id_cliente: 1,
          items: [{ id_producto: 1, cantidad: 99999 }], // Demanda excesiva
        });

      expect(res.status).toBe(400);
      expect(res.body.exito).toBe(false);
      expect(res.body.error).toContain('Stock insuficiente');
    });

    test('CP-INT-010: Ruta no encontrada responde 404', async () => {
      const res = await request(app).get('/api/ruta-que-no-existe');
      expect(res.status).toBe(404);
    });
  });
});
