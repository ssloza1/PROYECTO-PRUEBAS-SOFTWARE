// Pruebas unitarias de src/config/supabase.js. El SDK y dotenv se simulan.
const mockCreateClient = jest.fn(() => ({ cliente: 'supabase-falso' }));

jest.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
jest.mock('dotenv', () => ({ config: jest.fn() }));

const VARIABLES = ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_KEY'];

function cargarSupabase(entorno = {}) {
  VARIABLES.forEach((v) => delete process.env[v]);
  Object.assign(process.env, { NODE_ENV: 'test' }, entorno);
  let modulo;
  jest.isolateModules(() => {
    modulo = require('../../src/config/supabase');
  });
  return modulo;
}

describe('Pruebas Unitarias - config/supabase.js', () => {
  const respaldo = {};

  beforeAll(() => VARIABLES.forEach((v) => { respaldo[v] = process.env[v]; }));

  afterAll(() => VARIABLES.forEach((v) => {
    if (respaldo[v] === undefined) delete process.env[v];
    else process.env[v] = respaldo[v];
  }));

  beforeEach(() => mockCreateClient.mockClear());
  afterEach(() => jest.restoreAllMocks());

  test('CP-CFG-SUP-001: con URL y SUPABASE_SECRET_KEY crea el cliente del SDK', () => {
    const supabase = cargarSupabase({ SUPABASE_URL: 'https://proyecto.supabase.co', SUPABASE_SECRET_KEY: 'clave-secreta' });

    expect(mockCreateClient).toHaveBeenCalledWith('https://proyecto.supabase.co', 'clave-secreta');
    expect(supabase).toEqual({ cliente: 'supabase-falso' });
  });

  test('CP-CFG-SUP-002: acepta SUPABASE_KEY como clave alternativa', () => {
    cargarSupabase({ SUPABASE_URL: 'https://proyecto.supabase.co', SUPABASE_KEY: 'clave-alterna' });

    expect(mockCreateClient).toHaveBeenCalledWith('https://proyecto.supabase.co', 'clave-alterna');
  });

  test('CP-CFG-SUP-003: sin clave exporta null y no muestra aviso en entorno test', () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    const supabase = cargarSupabase();

    expect(supabase).toBeNull();
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  test('CP-CFG-SUP-004: sin clave fuera de test exporta null y muestra un aviso informativo', () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    const supabase = cargarSupabase({ NODE_ENV: 'development' });

    expect(supabase).toBeNull();
    expect(info).toHaveBeenCalledWith(expect.stringContaining('[Supabase SDK]'));
  });
});
