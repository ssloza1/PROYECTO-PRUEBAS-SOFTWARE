const {
  validarCedula,
  validarEmail,
  validarTexto,
  validarNumeroPositivo,
  validarEnteroPositivo,
} = require('../../src/utils/validadores');

describe('Pruebas Unitarias - Módulo de Validadores de Entrada', () => {
  describe('Función: validarCedula', () => {
    test('CP-VAL-CED-001: Cédula válida con algoritmo módulo 10 (ej. Pichincha 1710034065)', () => {
      const res = validarCedula('1710034065');
      expect(res.esValida).toBe(true);
    });

    test('CP-VAL-CED-002: Cédulas de entorno de prueba con prefijo TEST-', () => {
      expect(validarCedula('TEST-CLI-001').esValida).toBe(true);
      expect(validarCedula('TEST-9999').esValida).toBe(true);
    });

    test('CP-VAL-CED-003: Rechaza longitud menor a 10 dígitos', () => {
      const res = validarCedula('171003406');
      expect(res.esValida).toBe(false);
      expect(res.razon).toContain('10 dígitos');
    });

    test('CP-VAL-CED-004: Rechaza longitud mayor a 10 dígitos', () => {
      const res = validarCedula('17100340650');
      expect(res.esValida).toBe(false);
    });

    test('CP-VAL-CED-005: Rechaza código de provincia inválido (> 24)', () => {
      const res = validarCedula('9910034065');
      expect(res.esValida).toBe(false);
      expect(res.razon).toContain('provincia');
    });

    test('CP-VAL-CED-006: Rechaza dígito verificador erróneo', () => {
      const res = validarCedula('1710034069'); // Último dígito alterado
      expect(res.esValida).toBe(false);
      expect(res.razon).toContain('verificador');
    });

    test('CP-VAL-CED-007: Rechaza valor nulo o vacío', () => {
      expect(validarCedula(null).esValida).toBe(false);
      expect(validarCedula('').esValida).toBe(false);
    });
  });

  describe('Función: validarEmail', () => {
    test('CP-VAL-EML-001: Emails válidos', () => {
      expect(validarEmail('test@empresa.com')).toBe(true);
      expect(validarEmail('cliente.vip@dominio.ec')).toBe(true);
    });

    test('CP-VAL-EML-002: Emails inválidos sin @ o sin dominio', () => {
      expect(validarEmail('correo-sin-arroba.com')).toBe(false);
      expect(validarEmail('usuario@')).toBe(false);
      expect(validarEmail('@dominio.com')).toBe(false);
      expect(validarEmail('')).toBe(false);
      expect(validarEmail(null)).toBe(false);
    });
  });

  describe('Función: validarTexto', () => {
    test('CP-VAL-TXT-001: Texto dentro del rango admitido', () => {
      expect(validarTexto('Laptop Gamer', 2, 50)).toBe(true);
    });

    test('CP-VAL-TXT-002: Texto inferior al límite mínimo', () => {
      expect(validarTexto('A', 2, 50)).toBe(false);
    });

    test('CP-VAL-TXT-003: Texto superior al límite máximo', () => {
      const textoLargo = 'a'.repeat(51);
      expect(validarTexto(textoLargo, 2, 50)).toBe(false);
    });

    test('CP-VAL-TXT-004: Solo espacios en blanco no cumple longitud mínima', () => {
      expect(validarTexto('   ', 2, 50)).toBe(false);
    });
  });

  describe('Función: validarNumeroPositivo y validarEnteroPositivo', () => {
    test('CP-VAL-NUM-001: Números positivos válidos', () => {
      expect(validarNumeroPositivo(15.5)).toBe(true);
      expect(validarNumeroPositivo('20.99')).toBe(true);
    });

    test('CP-VAL-NUM-002: Comportamiento con cero según bandera permitirCero', () => {
      expect(validarNumeroPositivo(0, false)).toBe(false);
      expect(validarNumeroPositivo(0, true)).toBe(true);
    });

    test('CP-VAL-NUM-003: Entero positivo rechaza decimales', () => {
      expect(validarEnteroPositivo(10)).toBe(true);
      expect(validarEnteroPositivo(10.5)).toBe(false);
      expect(validarEnteroPositivo(-5)).toBe(false);
    });
  });
});
