const {
  redondear,
  calcularSubtotal,
  calcularIVA,
  calcularDescuento,
  calcularTotalesVenta,
  evaluarNivelStock,
  hayStockSuficiente,
} = require('../../src/utils/calculos');

describe('Pruebas Unitarias - Módulo de Cálculos Comerciales', () => {
  describe('Función: redondear', () => {
    test('CP-CALC-001: Redondeo estándar a 2 decimales hacia arriba', () => {
      expect(redondear(15.556)).toBe(15.56);
    });

    test('CP-CALC-002: Redondeo estándar a 2 decimales hacia abajo', () => {
      expect(redondear(15.554)).toBe(15.55);
    });

    test('CP-CALC-003: Debe lanzar TypeError si el valor no es un número', () => {
      expect(() => redondear('texto')).toThrow(TypeError);
      expect(() => redondear(NaN)).toThrow(TypeError);
    });
  });

  describe('Función: calcularSubtotal (Análisis de Valores Límite y Partición de Equivalencia)', () => {
    test('CP-SUBT-001: Cálculo correcto con valores válidos (caso típico)', () => {
      const resultado = calcularSubtotal(3, 10.5);
      expect(resultado).toBe(31.5);
    });

    test('CP-SUBT-002: Límite inferior válido de precio (precio = 0)', () => {
      expect(calcularSubtotal(2, 0)).toBe(0);
    });

    test('CP-SUBT-003: Límite inferior válido de cantidad (cantidad = 1)', () => {
      expect(calcularSubtotal(1, 15.25)).toBe(15.25);
    });

    test('CP-SUBT-004: Valor frontera inválido: cantidad = 0 debe lanzar error', () => {
      expect(() => calcularSubtotal(0, 10)).toThrow('La cantidad debe ser un número entero mayor a cero');
    });

    test('CP-SUBT-005: Valor frontera inválido: cantidad negativa debe lanzar error', () => {
      expect(() => calcularSubtotal(-1, 10)).toThrow('La cantidad debe ser un número entero mayor a cero');
    });

    test('CP-SUBT-006: Cantidad no entera (ej. decimal 1.5) debe lanzar error', () => {
      expect(() => calcularSubtotal(1.5, 10)).toThrow('La cantidad debe ser un número entero mayor a cero');
    });

    test('CP-SUBT-007: Valor frontera inválido: precio negativo debe lanzar error', () => {
      expect(() => calcularSubtotal(2, -0.01)).toThrow('El precio unitario debe ser un número mayor o igual a cero');
    });
  });

  describe('Función: calcularIVA y calcularDescuento', () => {
    test('CP-IVA-001: Cálculo de IVA al 15%', () => {
      expect(calcularIVA(100, 15)).toBe(15);
      expect(calcularIVA(33.33, 15)).toBe(5.00);
    });

    test('CP-IVA-002: IVA al 0% devuelve 0', () => {
      expect(calcularIVA(250, 0)).toBe(0);
    });

    test('CP-IVA-003: Rechaza porcentajes de IVA fuera de rango [0, 100]', () => {
      expect(() => calcularIVA(100, -5)).toThrow('El porcentaje de IVA debe estar entre 0 y 100');
      expect(() => calcularIVA(100, 105)).toThrow('El porcentaje de IVA debe estar entre 0 y 100');
    });

    test('CP-DESC-001: Cálculo de descuento válido', () => {
      expect(calcularDescuento(200, 10)).toBe(20);
    });

    test('CP-DESC-002: Descuento 0% devuelve 0', () => {
      expect(calcularDescuento(200, 0)).toBe(0);
    });
  });

  describe('Función: evaluarNivelStock (Particiones de Equivalencia)', () => {
    const stockMinimo = 5;

    test('CP-STK-001: Partición AGOTADO (stock = 0)', () => {
      expect(evaluarNivelStock(0, stockMinimo)).toBe('AGOTADO');
    });

    test('CP-STK-002: Partición AGOTADO (stock negativo)', () => {
      expect(evaluarNivelStock(-2, stockMinimo)).toBe('AGOTADO');
    });

    test('CP-STK-003: Partición CRITICO - Valor frontera inferior (stock = 1)', () => {
      expect(evaluarNivelStock(1, stockMinimo)).toBe('CRITICO');
    });

    test('CP-STK-004: Partición CRITICO - Valor frontera superior (stock == stockMinimo = 5)', () => {
      expect(evaluarNivelStock(5, stockMinimo)).toBe('CRITICO');
    });

    test('CP-STK-005: Partición NORMAL - Valor frontera justo superior (stock = stockMinimo + 1 = 6)', () => {
      expect(evaluarNivelStock(6, stockMinimo)).toBe('NORMAL');
    });

    test('CP-STK-006: Partición NORMAL - Stock holgado (stock = 50)', () => {
      expect(evaluarNivelStock(50, stockMinimo)).toBe('NORMAL');
    });
  });

  describe('Función: hayStockSuficiente (Valores Límite)', () => {
    test('CP-CHK-001: Stock mayor que cantidad (suficiente)', () => {
      expect(hayStockSuficiente(10, 3)).toBe(true);
    });

    test('CP-CHK-002: Valor límite: Stock exactamente igual a la cantidad (suficiente)', () => {
      expect(hayStockSuficiente(5, 5)).toBe(true);
    });

    test('CP-CHK-003: Valor límite: Cantidad 1 unidad mayor que el stock (insuficiente)', () => {
      expect(hayStockSuficiente(5, 6)).toBe(false);
    });

    test('CP-CHK-004: Cantidad requerida 0 o negativa debe lanzar error', () => {
      expect(() => hayStockSuficiente(10, 0)).toThrow('La cantidad requerida debe ser mayor a cero');
      expect(() => hayStockSuficiente(10, -3)).toThrow('La cantidad requerida debe ser mayor a cero');
    });
  });

  describe('Función: calcularTotalesVenta (Integración de cálculos)', () => {
    test('CP-TOT-001: Calcula totales correctamente para varios ítems con IVA y descuento', () => {
      const items = [
        { cantidad: 2, precio_unitario: 15.5 }, // 31.00
        { cantidad: 4, precio_unitario: 8.25 },  // 33.00
      ]; // subtotal = 64.00

      const resultado = calcularTotalesVenta(items, {
        porcentajeDescuento: 10, // descuento 6.40 -> base 57.60
        porcentajeIVA: 15,        // IVA 15% de 57.60 = 8.64 -> total 66.24
      });

      expect(resultado.subtotal).toBe(64.00);
      expect(resultado.descuento).toBe(6.40);
      expect(resultado.iva).toBe(8.64);
      expect(resultado.total).toBe(66.24);
      expect(resultado.totalItems).toBe(6);
    });

    test('CP-TOT-002: Lanza error si la lista de ítems está vacía', () => {
      expect(() => calcularTotalesVenta([])).toThrow('La lista de ítems de la venta no puede estar vacía');
    });
  });
});
