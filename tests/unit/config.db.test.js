// Pruebas unitarias de src/config/db.js. El paquete pg y dotenv se simulan:
// no se abre ninguna conexión y no se leen las variables del archivo .env real.
const mockPool = {
  on: jest.fn(),
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};
const mockPoolConstructor = jest.fn(() => mockPool);

jest.mock('pg', () => ({ Pool: mockPoolConstructor }));
jest.mock('dotenv', () => ({ config: jest.fn() }));

const VARIABLES = ['NODE_ENV', 'DATABASE_URL', 'DB_SSL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

/** Carga db.js de forma aislada con las variables de entorno indicadas */
function cargarDb(entorno = {}) {
  VARIABLES.forEach((v) => delete process.env[v]);
  Object.assign(process.env, { NODE_ENV: 'test' }, entorno);
  let modulo;
  jest.isolateModules(() => {
    modulo = require('../../src/config/db');
  });
  return modulo;
}

describe('Pruebas Unitarias - config/db.js (pool de conexiones)', () => {
  const respaldo = {};

  beforeAll(() => VARIABLES.forEach((v) => { respaldo[v] = process.env[v]; }));

  afterAll(() => VARIABLES.forEach((v) => {
    if (respaldo[v] === undefined) delete process.env[v];
    else process.env[v] = respaldo[v];
  }));

  beforeEach(() => {
    mockPoolConstructor.mockClear();
    mockPool.on.mockClear();
    mockPool.query.mockReset();
    mockPool.connect.mockReset();
    mockPool.end.mockReset();
  });

  afterEach(() => jest.restoreAllMocks());

  test('CP-CFG-DB-001: con DATABASE_URL usa connectionString, SSL sin verificar y pool de 2 en test', () => {
    cargarDb({ DATABASE_URL: 'postgresql://usuario:clave@host:5432/bd' });

    expect(mockPoolConstructor).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: 'postgresql://usuario:clave@host:5432/bd',
      ssl: { rejectUnauthorized: false },
      max: 2,
    }));
  });

  test('CP-CFG-DB-002: DB_SSL=false desactiva SSL', () => {
    cargarDb({ DATABASE_URL: 'postgresql://u:c@h:5432/bd', DB_SSL: 'false' });

    expect(mockPoolConstructor.mock.calls[0][0].ssl).toBe(false);
  });

  test('CP-CFG-DB-003: sin DATABASE_URL usa las variables individuales DB_*', () => {
    cargarDb({ DB_HOST: 'localhost', DB_PORT: '6543', DB_NAME: 'ventas', DB_USER: 'postgres', DB_PASSWORD: 'clave-de-prueba', DB_SSL: 'false' });

    expect(mockPoolConstructor).toHaveBeenCalledWith(expect.objectContaining({
      host: 'localhost',
      port: 6543,
      database: 'ventas',
      user: 'postgres',
      password: 'clave-de-prueba',
      ssl: false,
      max: 2,
    }));
  });

  test('CP-CFG-DB-004: sin ninguna variable usa valores por defecto para host, puerto y base de datos', () => {
    cargarDb();

    const config = mockPoolConstructor.mock.calls[0][0];
    expect(config.host).toBe('aws-0-us-east-1.pooler.supabase.com');
    expect(config.port).toBe(5432);
    expect(config.database).toBe('postgres');
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  test('CP-CFG-DB-005: fuera de test el pool es de 10 conexiones', () => {
    cargarDb({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:c@h:5432/bd' });

    expect(mockPoolConstructor.mock.calls[0][0].max).toBe(10);
  });

  test('CP-CFG-DB-006: query delega en pool.query y devuelve el resultado', async () => {
    const db = cargarDb({ DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    mockPool.query.mockResolvedValue({ rows: [{ ok: 1 }] });

    const res = await db.query('SELECT 1', []);

    expect(res.rows).toEqual([{ ok: 1 }]);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', []);
  });

  test('CP-CFG-DB-007: una consulta lenta (> 500 ms) fuera de test genera una advertencia', async () => {
    const db = cargarDb({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    mockPool.query.mockResolvedValue({ rows: [] });
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(600);

    await db.query('SELECT pg_sleep(1)');

    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('[DB Slow Query]'));
  });

  test('CP-CFG-DB-008: una consulta rápida o en entorno test no genera advertencia', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const dbTest = cargarDb({ DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    mockPool.query.mockResolvedValue({ rows: [] });
    jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(900);
    await dbTest.query('SELECT 1');

    const dbProd = cargarDb({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    mockPool.query.mockResolvedValue({ rows: [] });
    jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(100);
    await dbProd.query('SELECT 1');

    expect(aviso).not.toHaveBeenCalled();
  });

  test('CP-CFG-DB-009: getClient obtiene una conexión del pool y closePool cierra el pool', async () => {
    const db = cargarDb({ DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    const cliente = { release: jest.fn() };
    mockPool.connect.mockResolvedValue(cliente);
    mockPool.end.mockResolvedValue();

    await expect(db.getClient()).resolves.toBe(cliente);
    await db.closePool();

    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });

  test('CP-CFG-DB-010: el evento "error" del pool se registra en consola sin detener la aplicación', () => {
    cargarDb({ DATABASE_URL: 'postgresql://u:c@h:5432/bd' });
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const [evento, manejador] = mockPool.on.mock.calls[0];

    manejador(new Error('conexión caída'));

    expect(evento).toBe('error');
    expect(consola).toHaveBeenCalledWith('[DB Pool Error]', 'conexión caída');
  });
});
