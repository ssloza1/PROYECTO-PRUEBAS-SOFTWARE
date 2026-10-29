// DEFECTOS CONOCIDOS (nivel API).
//
// Cada prueba describe el comportamiento CORRECTO esperado (error del cliente 4xx) y se marca con
// `test.failing`: mientras el defecto exista, la prueba "pasa" (porque el código falla como se
// documentó); cuando se corrija el código, Jest avisará que la prueba marcada como failing ahora
// pasa y habrá que quitar `.failing` para convertirla en una prueba normal.
//
// Causa raíz común: el errorHandler decide 400 o 500 buscando palabras dentro del mensaje
// ("obligatorio", "no encontrado", "válido"...). Mensajes como "obligatoria", "no encontrada" o
// "Ya existe..." no coinciden y terminan como 500 (error del servidor).
jest.mock('../../src/repositories/productoRepository', () => require('../helpers/fakeRepositories').productoRepository);
jest.mock('../../src/repositories/clienteRepository', () => require('../helpers/fakeRepositories').clienteRepository);
jest.mock('../../src/repositories/ventaRepository', () => require('../helpers/fakeRepositories').ventaRepository);
jest.mock('../../src/repositories/catalogoRepository', () => require('../helpers/fakeRepositories').catalogoRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const { reset } = require('../helpers/fakeRepositories');

function esErrorDelCliente(res) {
  expect(res.statusCode).toBeGreaterThanOrEqual(400);
  expect(res.statusCode).toBeLessThan(500);
  expect(res.body.exito).toBe(false);
}

describe('Defectos conocidos - códigos HTTP incorrectos (500 en lugar de 4xx)', () => {
  beforeEach(() => reset());

  test.failing('CP-DEF-API-001: POST /api/clientes sin cédula debe responder 4xx (hoy responde 500)', async () => {
    const res = await request(app).post('/api/clientes').send({ nombre: 'Ana Prueba' });
    esErrorDelCliente(res);
  });

  test.failing('CP-DEF-API-002: POST /api/clientes con dígito verificador incorrecto debe responder 4xx (hoy 500)', async () => {
    const res = await request(app).post('/api/clientes').send({ nombre: 'Ana Prueba', cedula: '1710034069' });
    esErrorDelCliente(res);
  });

  test.failing('CP-DEF-API-003: POST /api/clientes con cédula repetida debe responder 4xx (hoy responde 500)', async () => {
    const res = await request(app).post('/api/clientes').send({ nombre: 'Otra Ana', cedula: 'TEST-CLI-001' });
    esErrorDelCliente(res);
  });

  test.failing('CP-DEF-API-004: GET /api/ventas/:id inexistente debe responder 4xx (hoy responde 500)', async () => {
    const res = await request(app).get('/api/ventas/999');
    esErrorDelCliente(res);
  });

  test.failing('CP-DEF-API-005: POST /api/ventas/:id/anular de una venta inexistente debe responder 4xx (hoy 500)', async () => {
    const res = await request(app).post('/api/ventas/999/anular');
    esErrorDelCliente(res);
  });
});
