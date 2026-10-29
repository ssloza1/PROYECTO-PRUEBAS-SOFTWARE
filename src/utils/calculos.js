/**
 * Módulo de cálculos comerciales para inventario y ventas
 * Diseñado con funciones puras para facilitar pruebas unitarias
 * (Particiones de Equivalencia y Valores Límite).
 */

/**
 * Redondea un valor numérico a un número específico de decimales
 * @param {number} valor 
 * @param {number} [decimales=2] 
 * @returns {number}
 */
function redondear(valor, decimales = 2) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    throw new TypeError('El valor a redondear debe ser un número válido');
  }
  const factor = Math.pow(10, decimales);
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

/**
 * Calcula el subtotal para un ítem de venta
 * @param {number} cantidad - Debe ser entero > 0
 * @param {number} precioUnitario - Debe ser >= 0
 * @returns {number}
 */
function calcularSubtotal(cantidad, precioUnitario) {
  if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un número entero mayor a cero');
  }
  if (typeof precioUnitario !== 'number' || Number.isNaN(precioUnitario) || precioUnitario < 0) {
    throw new Error('El precio unitario debe ser un número mayor o igual a cero');
  }
  return redondear(cantidad * precioUnitario, 2);
}

/**
 * Calcula el valor del IVA sobre una base imponible
 * @param {number} baseImponible 
 * @param {number} [porcentajeIVA=0] 
 * @returns {number}
 */
function calcularIVA(baseImponible, porcentajeIVA = 0) {
  if (typeof baseImponible !== 'number' || baseImponible < 0) {
    throw new Error('La base imponible debe ser un número mayor o igual a cero');
  }
  if (typeof porcentajeIVA !== 'number' || porcentajeIVA < 0 || porcentajeIVA > 100) {
    throw new Error('El porcentaje de IVA debe estar entre 0 y 100');
  }
  return redondear(baseImponible * (porcentajeIVA / 100), 2);
}

/**
 * Calcula el descuento aplicado a un subtotal
 * @param {number} subtotal 
 * @param {number} [porcentajeDescuento=0] 
 * @returns {number}
 */
function calcularDescuento(subtotal, porcentajeDescuento = 0) {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    throw new Error('El subtotal debe ser un número mayor o igual a cero');
  }
  if (typeof porcentajeDescuento !== 'number' || porcentajeDescuento < 0 || porcentajeDescuento > 100) {
    throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
  }
  return redondear(subtotal * (porcentajeDescuento / 100), 2);
}

/**
 * Calcula los totales consolidados de un conjunto de ítems de venta
 * @param {Array<{cantidad: number, precio_unitario: number}>} items 
 * @param {object} [opciones={}]
 * @param {number} [opciones.porcentajeIVA=0]
 * @param {number} [opciones.porcentajeDescuento=0]
 * @returns {{subtotal: number, descuento: number, iva: number, total: number, totalItems: number}}
 */
function calcularTotalesVenta(items, opciones = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La lista de ítems de la venta no puede estar vacía');
  }

  const porcentajeIVA = opciones.porcentajeIVA || 0;
  const porcentajeDescuento = opciones.porcentajeDescuento || 0;

  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    const itemSubtotal = calcularSubtotal(item.cantidad, Number(item.precio_unitario));
    subtotal = redondear(subtotal + itemSubtotal, 2);
    totalItems += item.cantidad;
  }

  const descuento = calcularDescuento(subtotal, porcentajeDescuento);
  const baseImponible = redondear(subtotal - descuento, 2);
  const iva = calcularIVA(baseImponible, porcentajeIVA);
  const total = redondear(baseImponible + iva, 2);

  return {
    subtotal,
    descuento,
    iva,
    total,
    totalItems,
  };
}

/**
 * Evalúa el estado de inventario de un producto según umbrales de stock
 * Partición de equivalencia:
 * - AGOTADO: stock <= 0
 * - CRITICO: 0 < stock <= stockMinimo
 * - NORMAL: stock > stockMinimo
 * 
 * @param {number} stock 
 * @param {number} stockMinimo 
 * @returns {'AGOTADO'|'CRITICO'|'NORMAL'}
 */
function evaluarNivelStock(stock, stockMinimo = 0) {
  if (typeof stock !== 'number' || Number.isNaN(stock)) {
    throw new TypeError('El stock debe ser un valor numérico');
  }
  if (typeof stockMinimo !== 'number' || Number.isNaN(stockMinimo) || stockMinimo < 0) {
    throw new Error('El stock mínimo debe ser un número mayor o igual a cero');
  }

  if (stock <= 0) {
    return 'AGOTADO';
  }
  if (stock <= stockMinimo) {
    return 'CRITICO';
  }
  return 'NORMAL';
}

/**
 * Valida si hay stock suficiente para satisfacer una cantidad demandada
 * Valores límite:
 * - stock < cantidad: false
 * - stock === cantidad: true (quedará en 0)
 * - stock > cantidad: true
 * 
 * @param {number} stockActual 
 * @param {number} cantidadRequerida 
 * @returns {boolean}
 */
function hayStockSuficiente(stockActual, cantidadRequerida) {
  if (typeof stockActual !== 'number' || typeof cantidadRequerida !== 'number') {
    throw new TypeError('Tanto el stock como la cantidad requerida deben ser números');
  }
  if (cantidadRequerida <= 0) {
    throw new Error('La cantidad requerida debe ser mayor a cero');
  }
  return stockActual >= cantidadRequerida;
}

module.exports = {
  redondear,
  calcularSubtotal,
  calcularIVA,
  calcularDescuento,
  calcularTotalesVenta,
  evaluarNivelStock,
  hayStockSuficiente,
};
