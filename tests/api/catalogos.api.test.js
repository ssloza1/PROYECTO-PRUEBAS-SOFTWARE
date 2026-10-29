// Pruebas de validación de /api/catalogos (categorías y proveedores).
jest.mock('../../src/repositories/catalogoRepository', () => require('../helpers/fakeRepositories').catalogoRepository);
jest.mock('../../src/config/db', () => require('../helpers/fakeRepositories').db);

const request = require('supertest');
const app = require('../../src/app');
const { reset } = require('../helpers/fakeRepositories');

describe('API - /api/catalogos', () => {
  beforeEach(() => reset());

  describe('Categorías', () => {
    test('CP-API-CAT-001: GET lista las categorías', async () => {
      const res = await request(app).get('/api/catalogos/categorias');

      expect(res.statusCode).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.total).toBe(1);
      expect(res.body.datos[0].nombre).toBe('Tecnología');
    });

    test('CP-API-CAT-002: POST crea una categoría y luego aparece en el GET', async () => {
      const creada = await request(app)
        .post('/api/catalogos/categorias')
        .send({ nombre: '  Oficina  ', descripcion: ' Artículos de oficina ' });
      const lista = await request(app).get('/api/catalogos/categorias');

      expect(creada.statusCode).toBe(201);
      expect(creada.body.datos.nombre).toBe('Oficina');
      expect(creada.body.datos.descripcion).toBe('Artículos de oficina');
      expect(lista.body.total).toBe(2);
    });

    test('CP-API-CAT-003: POST sin descripción guarda null', async () => {
      const res = await request(app).post('/api/catalogos/categorias').send({ nombre: 'Redes' });

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.descripcion).toBeNull();
    });

    test('CP-API-CAT-004: POST rechaza nombres vacíos, cortos o demasiado largos (valores límite 2 y 100)', async () => {
      const sinNombre = await request(app).post('/api/catalogos/categorias').send({});
      const corto = await request(app).post('/api/catalogos/categorias').send({ nombre: 'A' });
      const limiteInferior = await request(app).post('/api/catalogos/categorias').send({ nombre: 'AB' });
      const limiteSuperior = await request(app).post('/api/catalogos/categorias').send({ nombre: 'a'.repeat(100) });
      const largo = await request(app).post('/api/catalogos/categorias').send({ nombre: 'a'.repeat(101) });

      expect(sinNombre.statusCode).toBe(400);
      expect(corto.statusCode).toBe(400);
      expect(largo.statusCode).toBe(400);
      expect(limiteInferior.statusCode).toBe(201);
      expect(limiteSuperior.statusCode).toBe(201);
      expect(sinNombre.body.error).toContain('nombre de la categoría es obligatorio');
    });
  });

  describe('Proveedores', () => {
    test('CP-API-CAT-005: GET lista todos los proveedores y filtra por ?activo=', async () => {
      const todos = await request(app).get('/api/catalogos/proveedores');
      const activos = await request(app).get('/api/catalogos/proveedores?activo=true');
      const inactivos = await request(app).get('/api/catalogos/proveedores?activo=false');

      expect(todos.body.total).toBe(2);
      expect(activos.body.datos.map((p) => p.id_proveedor)).toEqual([1]);
      expect(inactivos.body.datos.map((p) => p.id_proveedor)).toEqual([2]);
    });

    test('CP-API-CAT-006: POST registra un proveedor con datos normalizados', async () => {
      const res = await request(app).post('/api/catalogos/proveedores').send({
        nombre: ' Tecno SA ',
        telefono: ' 022345678 ',
        correo: ' VENTAS@Tecno.com ',
        direccion: ' Av. Amazonas ',
        activo: false,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.nombre).toBe('Tecno SA');
      expect(res.body.datos.telefono).toBe('022345678');
      expect(res.body.datos.correo).toBe('ventas@tecno.com');
      expect(res.body.datos.direccion).toBe('Av. Amazonas');
      expect(res.body.datos.activo).toBe(false);
    });

    test('CP-API-CAT-007: POST con solo el nombre usa valores por defecto (activo = true)', async () => {
      const res = await request(app).post('/api/catalogos/proveedores').send({ nombre: 'Mínimo SA' });

      expect(res.statusCode).toBe(201);
      expect(res.body.datos.activo).toBe(true);
      expect(res.body.datos.correo).toBeNull();
    });

    test('CP-API-CAT-008: POST rechaza nombre inválido y correo inválido', async () => {
      const sinNombre = await request(app).post('/api/catalogos/proveedores').send({ correo: 'a@b.com' });
      const largo = await request(app).post('/api/catalogos/proveedores').send({ nombre: 'a'.repeat(121) });
      const correo = await request(app).post('/api/catalogos/proveedores').send({ nombre: 'Tecno SA', correo: 'mal-correo' });

      expect(sinNombre.statusCode).toBe(400);
      expect(sinNombre.body.error).toContain('nombre del proveedor es obligatorio');
      expect(largo.statusCode).toBe(400);
      expect(correo.statusCode).toBe(400);
      expect(correo.body.error).toContain('correo del proveedor no es válido');
    });
  });
});
