const db = require('../config/db');

/**
 * Repositorio de acceso a datos para Ventas y Detalle de Venta
 */
class VentaRepository {
  /**
   * Obtiene lista de ventas con información del cliente
   * @param {object} [filtros={}]
   * @param {import('pg').PoolClient} [client]
   */
  async findAll(filtros = {}, client = null) {
    const executor = client || db;
    let query = `
      SELECT 
        v.id_venta,
        v.id_cliente,
        c.nombre AS nombre_cliente,
        c.cedula AS cedula_cliente,
        v.fecha,
        v.total::float AS total,
        v.estado,
        COUNT(d.id_detalle)::int AS cantidad_items
      FROM public.ventas v
      INNER JOIN public.clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN public.detalle_venta d ON v.id_venta = d.id_venta
      WHERE 1=1
    `;
    const params = [];

    if (filtros.id_cliente) {
      params.push(filtros.id_cliente);
      query += ` AND v.id_cliente = $${params.length}`;
    }

    if (filtros.estado) {
      params.push(filtros.estado);
      query += ` AND v.estado = $${params.length}`;
    }

    query += `
      GROUP BY v.id_venta, v.id_cliente, c.nombre, c.cedula, v.fecha, v.total, v.estado
      ORDER BY v.fecha DESC, v.id_venta DESC
    `;

    const res = await executor.query(query, params);
    return res.rows;
  }

  /**
   * Obtiene una venta por ID incluyendo todos sus detalles
   * @param {number} id 
   * @param {import('pg').PoolClient} [client]
   */
  async findByIdWithDetails(id, client = null) {
    const executor = client || db;
    const saleQuery = `
      SELECT 
        v.id_venta,
        v.id_cliente,
        c.nombre AS nombre_cliente,
        c.cedula AS cedula_cliente,
        c.correo AS correo_cliente,
        v.fecha,
        v.total::float AS total,
        v.estado
      FROM public.ventas v
      INNER JOIN public.clientes c ON v.id_cliente = c.id_cliente
      WHERE v.id_venta = $1
    `;
    const saleRes = await executor.query(saleQuery, [id]);
    if (!saleRes.rows[0]) return null;

    const detailsQuery = `
      SELECT 
        d.id_detalle,
        d.id_producto,
        p.nombre AS nombre_producto,
        d.cantidad,
        d.precio_unitario::float AS precio_unitario,
        d.subtotal::float AS subtotal
      FROM public.detalle_venta d
      INNER JOIN public.productos p ON d.id_producto = p.id_producto
      WHERE d.id_venta = $1
      ORDER BY d.id_detalle ASC
    `;
    const detailsRes = await executor.query(detailsQuery, [id]);

    return {
      ...saleRes.rows[0],
      detalles: detailsRes.rows,
    };
  }

  /**
   * Inserta la cabecera de la venta
   * @param {object} data
   * @param {import('pg').PoolClient} client
   */
  async createHeader(data, client) {
    const query = `
      INSERT INTO public.ventas (id_cliente, total, estado)
      VALUES ($1, $2, $3)
      RETURNING id_venta, id_cliente, fecha, total::float AS total, estado
    `;
    const values = [
      data.id_cliente,
      data.total,
      data.estado || 'COMPLETADA',
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  /**
   * Inserta un detalle de venta
   * @param {object} data
   * @param {import('pg').PoolClient} client
   */
  async createDetail(data, client) {
    const query = `
      INSERT INTO public.detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
      VALUES ($1, $2, $3, $4)
      RETURNING id_detalle, id_venta, id_producto, cantidad, precio_unitario::float AS precio_unitario, subtotal::float AS subtotal
    `;
    const values = [
      data.id_venta,
      data.id_producto,
      data.cantidad,
      data.precio_unitario,
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  /**
   * Actualiza el estado de una venta (ej. a ANULADA)
   * @param {number} id 
   * @param {'COMPLETADA'|'ANULADA'} nuevoEstado 
   * @param {import('pg').PoolClient} client 
   */
  async updateStatus(id, nuevoEstado, client) {
    const query = `
      UPDATE public.ventas
      SET estado = $1
      WHERE id_venta = $2
      RETURNING id_venta, id_cliente, total::float AS total, estado
    `;
    const res = await client.query(query, [nuevoEstado, id]);
    return res.rows[0] || null;
  }

  /**
   * Obtiene los detalles de una venta (usado para restaurar stock al anular)
   * @param {number} idVenta 
   * @param {import('pg').PoolClient} [client]
   */
  async findDetailsByVentaId(idVenta, client = null) {
    const executor = client || db;
    const query = `
      SELECT id_detalle, id_venta, id_producto, cantidad, precio_unitario::float AS precio_unitario, subtotal::float AS subtotal
      FROM public.detalle_venta
      WHERE id_venta = $1
    `;
    const res = await executor.query(query, [idVenta]);
    return res.rows;
  }
}

module.exports = new VentaRepository();
