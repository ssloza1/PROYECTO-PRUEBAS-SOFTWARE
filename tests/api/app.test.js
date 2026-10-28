// Pruebas de validación de la aplicación Express (app.js y routes/index.js) con Supertest.
// Igual que en el Lab 2: se importa la instancia `app` sin levantar un servidor en un puerto.
jest.mock('../../src/repositories/catalogoRepository', () => require('../helpers/fakeRepositories').catalogoRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');

describe('API - Aplicación base (app.js e index de rutas)', () => {
  test('CP-API-APP-001: GET /api/health responde 200 con estado UP', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.estado).toBe('UP');
    expect(typeof res.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  test('CP-API-APP-002: una ruta inexistente responde 404', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    expect(res.statusCode).toBe(404);
  });

  test('CP-API-APP-003: GET / sirve el frontend estático (index.html)', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  test('CP-API-APP-004: un JSON mal formado responde 400 con exito=false (errorHandler)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Content-Type', 'application/json')
      .send('{"nombre": ');

    expect(res.statusCode).toBe(400);
    expect(res.body.exito).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('CP-API-APP-005: acepta cuerpos urlencoded (express.urlencoded)', async () => {
    const res = await request(app)
      .post('/api/catalogos/categorias')
      .type('form')
      .send({ nombre: 'Accesorios' });

    expect(res.statusCode).toBe(201);
    expect(res.body.datos.nombre).toBe('Accesorios');
  });

  test('CP-API-APP-006: incluye la cabecera CORS (cors)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://otro-sitio.com');

    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
