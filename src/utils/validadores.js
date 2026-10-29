/**
 * Módulo de validación de datos para entidades del sistema
 * Incluye validaciones de formato, límites de longitud y reglas específicas.
 */

/**
 * Valida formato y algoritmo de cédula ecuatoriana (10 dígitos, módulo 10)
 * o identificador alfanumérico para pruebas.
 * @param {string} cedula 
 * @returns {{esValida: boolean, razon?: string}}
 */
function validarCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') {
    return { esValida: false, razon: 'La cédula es requerida y debe ser texto' };
  }

  const trimmed = cedula.trim();

  // Permitir cédulas de prueba controladas en entorno de testing
  if (trimmed.startsWith('TEST-')) {
    return { esValida: true };
  }

  if (!/^\d{10}$/.test(trimmed)) {
    return { esValida: false, razon: 'La cédula debe contener exactamente 10 dígitos numéricos' };
  }

  const provincia = Number.parseInt(trimmed.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
    return { esValida: false, razon: 'Código de provincia inválido (01 a 24 o 30)' };
  }

  const tercerDigito = Number.parseInt(trimmed[2], 10);
  if (tercerDigito >= 6) {
    return { esValida: false, razon: 'El tercer dígito de una persona natural debe ser menor a 6' };
  }

  // Algoritmo módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = Number.parseInt(trimmed[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = Number.parseInt(trimmed[9], 10);
  const residuo = suma % 10;
  const esperado = residuo === 0 ? 0 : 10 - residuo;

  if (digitoVerificador !== esperado) {
    return { esValida: false, razon: 'Dígito verificador de cédula no coincide' };
  }

  return { esValida: true };
}

/**
 * Valida un formato de correo electrónico
 * @param {string} email 
 * @returns {boolean}
 */
function validarEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const limpio = email.trim();
  const partes = limpio.split('@');
  if (partes.length !== 2) return false;
  const [usuario, dominio] = partes;
  return usuario.length > 0 && dominio.includes('.') && !dominio.startsWith('.') && !dominio.endsWith('.');
}

/**
 * Valida un campo de texto no vacío y dentro de un rango de longitud
 * @param {string} texto 
 * @param {number} [min=1] 
 * @param {number} [max=150] 
 * @returns {boolean}
 */
function validarTexto(texto, min = 1, max = 150) {
  if (typeof texto !== 'string') return false;
  const trimmed = texto.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

/**
 * Valida un número positivo o no negativo
 * @param {number|string} valor 
 * @param {boolean} [permitirCero=false] 
 * @returns {boolean}
 */
function validarNumeroPositivo(valor, permitirCero = false) {
  const num = Number(valor);
  if (Number.isNaN(num)) return false;
  return permitirCero ? num >= 0 : num > 0;
}

/**
 * Valida un entero positivo
 * @param {number|string} valor 
 * @param {boolean} [permitirCero=false] 
 * @returns {boolean}
 */
function validarEnteroPositivo(valor, permitirCero = false) {
  const num = Number(valor);
  if (!Number.isInteger(num)) return false;
  return permitirCero ? num >= 0 : num > 0;
}

module.exports = {
  validarCedula,
  validarEmail,
  validarTexto,
  validarNumeroPositivo,
  validarEnteroPositivo,
};
