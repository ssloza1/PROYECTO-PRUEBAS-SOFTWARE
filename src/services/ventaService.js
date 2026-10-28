const ventaRepository = require('../repositories/ventaRepository');
const productoRepository = require('../repositories/productoRepository');
const clienteRepository = require('../repositories/clienteRepository');
const db = require('../config/db');
const { calcularTotalesVenta, hayStockSuficiente } = require('../utils/calculos');
const { validarEnteroPositivo } = require('../utils/validadores');

/**
 * Servicio de lógica de negocio para Registro, Consulta y Anulación de Ventas
 */
class VentaService {
  constructor(
    ventaRepo = ventaRepository,
    productoRepo = productoRepository,
    clienteRepo = clienteRepository,
    dbModule = db
  ) {
    this.ventaRepo = ventaRepo;
    this.productoRepo = productoRepo;
    this.clienteRepo = clienteRepo;
    this.db = dbModule;
  }

  /**
   * Obtiene lista de ventas
   * @param {object} filtros
   */
  async listarVentas(filtros = {}) {
    return await this.ventaRepo.findAll(filtros);
  }

  /**
   * Obtiene el detalle completo de una venta por ID
   * @param {number} id
   */
  async obtenerPorId(id) {
    const idNum = Number(id);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de venta inválido');
    }
    const venta = await this.ventaRepo.findByIdWithDetails(idNum);
    if (!venta) {
      throw new Error(`Venta con ID ${idNum} no encontrada`);
    }
    return venta;
  }

  /**
   * Registra una venta completa con validación de reglas de negocio y transacción atómica
   * @param {object} payload
   * @param {number} payload.id_cliente
   * @param {Array<{id_producto: number, cantidad: number}>} payload.items
   * @param {number} [payload.porcentajeIVA=0]
   * @param {number} [payload.porcentajeDescuento=0]
   */
  async registrarVenta(payload) {
    // 1. Validar cliente
    const idCliente = Number(payload.id_cliente);
    if (!validarEnteroPositivo(idCliente)) {
      throw new Error('Debe especificar un ID de cliente válido');
    }

    const cliente = await this.clienteRepo.findById(idCliente);
    if (!cliente) {
      throw new Error(`El cliente con ID ${idCliente} no existe`);
    }
    if (!cliente.activo) {
      throw new Error(`El cliente ${cliente.nombre} se encuentra inactivo y no puede realizar compras`);
    }

    // 2. Validar ítems de la venta
    const { items } = payload;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('La venta debe incluir al menos un producto');
    }

    // Verificar unicidad de productos en los ítems
    const vistos = new Set();
    for (const item of items) {
      const idProd = Number(item.id_producto);
      if (vistos.has(idProd)) {
        throw new Error(`El producto ID ${idProd} está duplicado en la orden. Agrupe la cantidad en una sola línea.`);
      }
      vistos.add(idProd);
    }

    // 3. Validar existencia, estado activo y stock de cada producto
    const itemsProcesados = [];
    for (const item of items) {
      const idProd = Number(item.id_producto);
      const cantidad = Number(item.cantidad);

      if (!validarEnteroPositivo(idProd)) {
        throw new Error('Cada ítem debe tener un ID de producto válido');
      }
      if (!validarEnteroPositivo(cantidad)) {
        throw new Error(`La cantidad del producto ID ${idProd} debe ser un entero mayor a cero`);
      }

      const producto = await this.productoRepo.findById(idProd);
      if (!producto) {
        throw new Error(`El producto con ID ${idProd} no existe`);
      }
      if (!producto.activo) {
        throw new Error(`El producto "${producto.nombre}" se encuentra inactivo`);
      }

      if (!hayStockSuficiente(producto.stock, cantidad)) {
        throw new Error(
          `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock}, requerido: ${cantidad}`
        );
      }

      itemsProcesados.push({
        id_producto: idProd,
        nombre: producto.nombre,
        cantidad,
        precio_unitario: Number(producto.precio),
      });
    }

    // 4. Calcular importes usando utilidades puras
    const calculos = calcularTotalesVenta(itemsProcesados, {
      porcentajeIVA: payload.porcentajeIVA || 0,
      porcentajeDescuento: payload.porcentajeDescuento || 0,
    });

    // 5. Ejecutar la transacción en base de datos
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Crear cabecera
      const cabecera = await this.ventaRepo.createHeader(
        {
          id_cliente: idCliente,
          total: calculos.total,
          estado: 'COMPLETADA',
        },
        client
      );

      // Insertar detalles y descontar stock
      const detallesCreados = [];
      for (const item of itemsProcesados) {
        const detalle = await this.ventaRepo.createDetail(
          {
            id_venta: cabecera.id_venta,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          },
          client
        );
        detallesCreados.push({
          ...detalle,
          nombre_producto: item.nombre,
        });

        // Descontar inventario (delta negativo)
        const prodActualizado = await this.productoRepo.updateStock(
          item.id_producto,
          -item.cantidad,
          client
        );
        if (!prodActualizado) {
          throw new Error(`No se pudo descontar el stock del producto ${item.nombre}`);
        }
      }

      await client.query('COMMIT');

      return {
        ...cabecera,
        cliente: {
          id_cliente: cliente.id_cliente,
          nombre: cliente.nombre,
          cedula: cliente.cedula,
        },
        detalles: detallesCreados,
        totales: calculos,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Anula una venta y repone automáticamente el stock de los productos
   * @param {number} idVenta
   */
  async anularVenta(idVenta) {
    const idNum = Number(idVenta);
    if (!validarEnteroPositivo(idNum)) {
      throw new Error('ID de venta inválido');
    }

    const venta = await this.ventaRepo.findByIdWithDetails(idNum);
    if (!venta) {
      throw new Error(`Venta con ID ${idNum} no encontrada`);
    }

    if (venta.estado === 'ANULADA') {
      throw new Error('La venta ya fue anulada previamente');
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Cambiar estado a ANULADA
      const ventaActualizada = await this.ventaRepo.updateStatus(idNum, 'ANULADA', client);

      // Reponer stock para cada detalle
      const detalles = await this.ventaRepo.findDetailsByVentaId(idNum, client);
      for (const d of detalles) {
        await this.productoRepo.updateStock(d.id_producto, d.cantidad, client);
      }

      await client.query('COMMIT');

      return {
        mensaje: `Venta #${idNum} anulada exitosamente. Stock restituido al inventario.`,
        venta: ventaActualizada,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new VentaService();
module.exports.VentaService = VentaService;
