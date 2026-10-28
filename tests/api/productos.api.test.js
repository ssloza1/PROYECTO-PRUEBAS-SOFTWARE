// Pruebas de validación de los endpoints /api/productos (rutas + controlador + servicio + errorHandler).
// Los repositorios se reemplazan por versiones en memoria: no se usa la base de datos real.
jest.mock('../../src/repositories/productoRepository', () => require('../helpers/fakeRepositories').productoRepository);
jest.mock('../../src/repositories/catalogoRepository', () => require('../helpers/fakeRepositories').catalogoRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const { reset } = require('../helpers/fakeRepositories');

const productoValido = {
  nombre: 'Monitor 24 pulgadas',
  descripcion: 'Monitor IPS Full HD',
  precio: 145,
  stock: 10,
  stock_minimo: 2,
  id_categoria: 1,
  id_proveedor: 1,
};

describe('API - /api/productos', () => {
  beforeEach(() => reset());

  describe('GET /api/productos (listar)', () => {
    test('CP-API-PROD-001: lista todos los productos con su nivel de stock calculado', async () => {
      const res = await request(app).get('/api/productos');

      expect(res.statusCode).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.total).toBe(4);
      const niveles = Object.fromEntries(res.body.datos.map((p) => [p.id_producto, p.nivel_stock]));
      expect(niveles).toEqual({ 1: 'NORMAL', 2: 'CRITICO', 3: 'AGOTADO', 4: 'NORMAL' });
    });

    test('CP-API-PROD-002: filtro ?activo=true excluye productos desactivados', async () => {
      const res = await request(app).get('/api/productos?activo=true');

      expect(res.body.total).toBe(3);
      expect(res.body.datos.every((p) => p.activo === true)).toBe(true);
    });

    test('CP-API-PROD-003: filtro ?stock_bajo=true devuelve solo CRITICO y AGOTADO', async () => {
      const res = await request(app).get('/api/productos?stock_bajo=true');

      expect(res.body.datos.map((p) => p.id_producto)).toEqual([2, 3]);
    });

    test('CP-API-PROD-004: filtro ?id_categoria=1 y búsqueda ?q=teclado', async () => {
      const porCategoria = await request(app).get('/api/productos?id_categoria=1');
      const porTexto = await request(app).get('/api/productos?q=teclado');
      const sinCoincidencias = await request(app).get('/api/productos?q=zzz');

      expect(porCategoria.body.total).toBe(4);
      expect(porTexto.body.datos).toHaveLength(1);
      expect(porTexto.body.datos[0].nombre).toBe('Teclado USB');
      expect(sinCoincidencias.body.total).toBe(0);
    });
  });

  describe('GET /api/productos/:id (detalle)', () => {
    test('CP-API-PROD-005: devuelve el producto existente con nivel_stock', async () => {
      const res = await request(app).get('/api/productos/2');

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.nombre).toBe('Ratón USB');
      expect(res.body.datos.nivel_stock).toBe('CRITICO');
    });

    test('CP-API-PROD-006: ID no numérico responde 400', async () => {
      const res = await request(app).get('/api/productos/abc');

      expect(res.statusCode).toBe(400);
      expect(res.body.exito).toBe(false);
      expect(res.body.error).toContain('entero positivo');
    });

    test('CP-API-PROD-007: producto inexistente responde 400 (comportamiento actual del errorHandler)', async () => {
      // NOTA: una API REST suele responder 404 aquí; hoy el errorHandler mapea "no encontrado" a 400.
      const res = await request(app).get('/api/productos/999');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('no encontrado');
    });
  });

  describe('POST /api/productos (crear)', () => {
    test('CP-API-PROD-008: crea un producto válido y responde 201', async () => {
      const res = await request(app).post('/api/productos').send(productoValido);

      expect(res.statusCode).toBe(201);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos.id_producto).toBe(5);
      expect(res.body.datos.nivel_stock).toBe('NORMAL');

      const lista = await request(app).get('/api/productos');
      expect(lista.body.total).toBe(5);
    });

    test('CP-API-PROD-009: el producto creado queda consultable por ID (flujo POST y luego GET)', async () => {
      const creado = await request(app).post('/api/productos').send(productoValido);
      const res = await request(app).get(`/api/productos/${creado.body.datos.id_producto}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.nombre).toBe('Monitor 24 pulgadas');
    });

    test('CP-API-PROD-010: rechaza datos inválidos con 400 y mensaje (partición de equivalencia inválida)', async () => {
      const casos = [
        [{ ...productoValido, nombre: '' }, 'nombre del producto es obligatorio'],
        [{ ...productoValido, nombre: 'A' }, 'nombre del producto es obligatorio'],
        [{ ...productoValido, precio: -0.01 }, 'precio debe ser'],
        [{ ...productoValido, precio: 'abc' }, 'precio debe ser'],
        [{ ...productoValido, stock: -1 }, 'stock debe ser'],
        [{ ...productoValido, stock: 1.5 }, 'stock debe ser'],
        [{ ...productoValido, stock_minimo: -1 }, 'stock mínimo debe ser'],
        [{ ...productoValido, id_categoria: undefined }, 'categoría válida'],
        [{ ...productoValido, id_categoria: 999 }, 'categoría con ID 999 no existe'],
        [{ ...productoValido, id_proveedor: undefined }, 'proveedor válido'],
        [{ ...productoValido, id_proveedor: 999 }, 'proveedor con ID 999 no existe'],
      ];

      for (const [cuerpo, mensaje] of casos) {
        const res = await request(app).post('/api/productos').send(cuerpo);
        expect(res.statusCode).toBe(400);
        expect(res.body.exito).toBe(false);
        expect(res.body.error).toContain(mensaje);
      }
    });

    test('CP-API-PROD-011: valor límite precio = 0 es válido', async () => {
      const res = await request(app).post('/api/productos').send({ ...productoValido, precio: 0 });

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.precio).toBe(0);
    });

    test('CP-API-PROD-012: sin stock ni stock_minimo se asumen 0 y queda AGOTADO', async () => {
      const sinStock = { ...productoValido };
      delete sinStock.stock;
      delete sinStock.stock_minimo;
      const res = await request(app).post('/api/productos').send(sinStock);

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.stock).toBe(0);
      expect(res.body.datos.nivel_stock).toBe('AGOTADO');
    });
  });

  describe('PUT /api/productos/:id (actualizar)', () => {
    test('CP-API-PROD-013: actualiza precio y stock y recalcula el nivel', async () => {
      const res = await request(app).put('/api/productos/1').send({ precio: 20, stock: 3 });

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.precio).toBe(20);
      expect(res.body.datos.stock).toBe(3);
      expect(res.body.datos.nivel_stock).toBe('CRITICO');
    });

    test('CP-API-PROD-014: rechaza actualizaciones inválidas con 400', async () => {
      const casos = [
        [{ nombre: 'A' }, 'nombre debe tener'],
        [{ precio: -1 }, 'precio debe ser'],
        [{ stock: 2.5 }, 'stock debe ser'],
        [{ stock_minimo: -3 }, 'stock mínimo debe ser'],
      ];

      for (const [cuerpo, mensaje] of casos) {
        const res = await request(app).put('/api/productos/1').send(cuerpo);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain(mensaje);
      }
    });

    test('CP-API-PROD-015: ID inválido o inexistente responde 400', async () => {
      const invalido = await request(app).put('/api/productos/abc').send({ precio: 1 });
      const inexistente = await request(app).put('/api/productos/999').send({ precio: 1 });

      expect(invalido.statusCode).toBe(400);
      expect(inexistente.statusCode).toBe(400);
      expect(inexistente.body.error).toContain('no encontrado');
    });
  });

  describe('DELETE /api/productos/:id (baja lógica)', () => {
    test('CP-API-PROD-016: desactiva el producto y no lo borra físicamente (RN-PROD-06)', async () => {
      const res = await request(app).delete('/api/productos/1');
      const detalle = await request(app).get('/api/productos/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.activo).toBe(false);
      expect(detalle.statusCode).toBe(200);
      expect(detalle.body.datos.activo).toBe(false);
    });

    test('CP-API-PROD-017: ID inválido o inexistente responde 400', async () => {
      const invalido = await request(app).delete('/api/productos/0');
      const inexistente = await request(app).delete('/api/productos/999');

      expect(invalido.statusCode).toBe(400);
      expect(inexistente.statusCode).toBe(400);
    });
  });
});
