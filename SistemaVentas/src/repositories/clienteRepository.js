const db = require('../config/db');

/**
 * Repositorio de acceso a datos para Clientes
 */
class ClienteRepository {
  /**
   * Obtiene todos los clientes
   * @param {object} [filtros={}] 
   * @param {import('pg').PoolClient} [client]
   */
  async findAll(filtros = {}, client = null) {
    const executor = client || db;
    let query = `
      SELECT id_cliente, nombre, cedula, telefono, correo, direccion, activo
      FROM public.clientes
      WHERE 1=1
    `;
    const params = [];

    if (filtros.activo !== undefined) {
      params.push(filtros.activo);
      query += ` AND activo = $${params.length}`;
    }

    if (filtros.busqueda) {
      params.push(`%${filtros.busqueda}%`);
      query += ` AND (nombre ILIKE $${params.length} OR cedula ILIKE $${params.length} OR correo ILIKE $${params.length})`;
    }

    query += ` ORDER BY id_cliente ASC`;

    const res = await executor.query(query, params);
    return res.rows;
  }

  /**
   * Busca cliente por ID
   * @param {number} id 
   * @param {import('pg').PoolClient} [client]
   */
  async findById(id, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT id_cliente, nombre, cedula, telefono, correo, direccion, activo 
       FROM public.clientes 
       WHERE id_cliente = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Busca cliente por cédula
   * @param {string} cedula 
   * @param {import('pg').PoolClient} [client]
   */
  async findByCedula(cedula, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `SELECT id_cliente, nombre, cedula, telefono, correo, direccion, activo 
       FROM public.clientes 
       WHERE cedula = $1`,
      [cedula]
    );
    return res.rows[0] || null;
  }

  /**
   * Crea un nuevo cliente
   * @param {object} data 
   * @param {import('pg').PoolClient} [client]
   */
  async create(data, client = null) {
    const executor = client || db;
    const query = `
      INSERT INTO public.clientes (nombre, cedula, telefono, correo, direccion, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_cliente, nombre, cedula, telefono, correo, direccion, activo
    `;
    const values = [
      data.nombre,
      data.cedula,
      data.telefono || null,
      data.correo || null,
      data.direccion || null,
      data.activo !== undefined ? data.activo : true,
    ];
    const res = await executor.query(query, values);
    return res.rows[0];
  }

  /**
   * Actualiza un cliente
   * @param {number} id 
   * @param {object} data 
   * @param {import('pg').PoolClient} [client]
   */
  async update(id, data, client = null) {
    const executor = client || db;
    const query = `
      UPDATE public.clientes
      SET 
        nombre = COALESCE($1, nombre),
        telefono = COALESCE($2, telefono),
        correo = COALESCE($3, correo),
        direccion = COALESCE($4, direccion),
        activo = COALESCE($5, activo)
      WHERE id_cliente = $6
      RETURNING id_cliente, nombre, cedula, telefono, correo, direccion, activo
    `;
    const values = [
      data.nombre,
      data.telefono,
      data.correo,
      data.direccion,
      data.activo,
      id,
    ];
    const res = await executor.query(query, values);
    return res.rows[0] || null;
  }

  /**
   * Baja lógica de cliente
   * @param {number} id 
   * @param {import('pg').PoolClient} [client]
   */
  async softDelete(id, client = null) {
    const executor = client || db;
    const res = await executor.query(
      `UPDATE public.clientes SET activo = FALSE WHERE id_cliente = $1 RETURNING id_cliente, nombre, activo`,
      [id]
    );
    return res.rows[0] || null;
  }
}

module.exports = new ClienteRepository();
