// Pruebas de validación de los endpoints /api/clientes con Supertest y repositorios en memoria.
jest.mock('../../src/repositories/clienteRepository', () => require('../helpers/fakeRepositories').clienteRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const { reset } = require('../helpers/fakeRepositories');

const clienteValido = {
  nombre: 'Alan Arias',
  cedula: '1710034065', // cédula con dígito verificador válido (módulo 10)
  telefono: '0991234567',
  correo: 'Alan.Arias@ESPE.edu.ec',
  direccion: 'Quito',
};

describe('API - /api/clientes', () => {
  beforeEach(() => reset());

  describe('GET /api/clientes', () => {
    test('CP-API-CLI-001: lista los clientes existentes', async () => {
      const res = await request(app).get('/api/clientes');

      expect(res.statusCode).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.total).toBe(2);
    });

    test('CP-API-CLI-002: filtros ?activo=true y búsqueda ?q=', async () => {
      const activos = await request(app).get('/api/clientes?activo=true');
      const busqueda = await request(app).get('/api/clientes?q=ana');

      expect(activos.body.datos.map((c) => c.id_cliente)).toEqual([1]);
      expect(busqueda.body.datos).toHaveLength(1);
      expect(busqueda.body.datos[0].nombre).toBe('Ana Pérez');
    });
  });

  describe('GET /api/clientes/:id', () => {
    test('CP-API-CLI-003: devuelve el cliente existente', async () => {
      const res = await request(app).get('/api/clientes/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.cedula).toBe('TEST-CLI-001');
    });

    test('CP-API-CLI-004: ID inválido o inexistente responde 400', async () => {
      const invalido = await request(app).get('/api/clientes/abc');
      const inexistente = await request(app).get('/api/clientes/999');

      expect(invalido.statusCode).toBe(400);
      expect(invalido.body.error).toContain('inválido');
      expect(inexistente.statusCode).toBe(400);
      expect(inexistente.body.error).toContain('no encontrado');
    });
  });

  describe('POST /api/clientes', () => {
    test('CP-API-CLI-005: registra un cliente válido, normaliza el correo y responde 201', async () => {
      const res = await request(app).post('/api/clientes').send(clienteValido);

      expect(res.statusCode).toBe(201);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos.correo).toBe('alan.arias@espe.edu.ec');
      expect(res.body.datos.activo).toBe(true);
    });

    test('CP-API-CLI-006: acepta cédulas de prueba con prefijo TEST- (RN-CLI-02)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .send({ nombre: 'Cliente de prueba', cedula: 'TEST-NUEVO-01' });

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.correo).toBeNull();
    });

    test('CP-API-CLI-007: rechaza cédulas con provincia inválida o tercer dígito mayor o igual a 6', async () => {
      const provincia = await request(app).post('/api/clientes').send({ nombre: 'Ana Prueba', cedula: '9910034065' });
      const tercerDigito = await request(app).post('/api/clientes').send({ nombre: 'Ana Prueba', cedula: '1760034065' });

      expect(provincia.statusCode).toBe(400);
      expect(provincia.body.error).toContain('provincia');
      expect(tercerDigito.statusCode).toBe(400);
      expect(tercerDigito.body.error).toContain('tercer dígito');
    });

    test('CP-API-CLI-008: rechaza datos inválidos con 400 y mensaje', async () => {
      const casos = [
        [{ ...clienteValido, nombre: '' }, 'nombre del cliente es obligatorio'],
        [{ ...clienteValido, nombre: 'A' }, 'nombre del cliente es obligatorio'],
        [{ ...clienteValido, cedula: '171003406' }, 'Cédula inválida'],
        [{ ...clienteValido, correo: 'sin-arroba.com' }, 'correo electrónico no tiene un formato válido'],
      ];

      for (const [cuerpo, mensaje] of casos) {
        const res = await request(app).post('/api/clientes').send(cuerpo);
        expect(res.statusCode).toBe(400);
        expect(res.body.exito).toBe(false);
        expect(res.body.error).toContain(mensaje);
      }
    });
  });

  describe('PUT /api/clientes/:id', () => {
    test('CP-API-CLI-009: actualiza nombre y correo (el correo se guarda en minúsculas)', async () => {
      const res = await request(app)
        .put('/api/clientes/1')
        .send({ nombre: 'Ana María Pérez', correo: 'ANA.MARIA@correo.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.nombre).toBe('Ana María Pérez');
      expect(res.body.datos.correo).toBe('ana.maria@correo.com');
    });

    test('CP-API-CLI-010: rechaza nombre o correo inválidos y ID inexistente', async () => {
      const nombre = await request(app).put('/api/clientes/1').send({ nombre: 'A' });
      const correo = await request(app).put('/api/clientes/1').send({ correo: 'mal-correo' });
      const invalido = await request(app).put('/api/clientes/abc').send({ nombre: 'Ana' });
      const inexistente = await request(app).put('/api/clientes/999').send({ nombre: 'Ana' });

      expect(nombre.statusCode).toBe(400);
      expect(correo.statusCode).toBe(400);
      expect(invalido.statusCode).toBe(400);
      expect(inexistente.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    test('CP-API-CLI-011: desactiva al cliente (baja lógica)', async () => {
      const res = await request(app).delete('/api/clientes/1');
      const detalle = await request(app).get('/api/clientes/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.activo).toBe(false);
      expect(detalle.body.datos.activo).toBe(false);
    });

    test('CP-API-CLI-012: ID inválido o inexistente responde 400', async () => {
      const invalido = await request(app).delete('/api/clientes/0');
      const inexistente = await request(app).delete('/api/clientes/999');

      expect(invalido.statusCode).toBe(400);
      expect(inexistente.statusCode).toBe(400);
    });
  });
});
