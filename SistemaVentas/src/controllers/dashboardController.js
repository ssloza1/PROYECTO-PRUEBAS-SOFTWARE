const db = require('../config/db');

class DashboardController {
  async obtenerMetricas(req, res, next) {
    try {
      // 1. Estadísticas de ventas
      const ventasRes = await db.query(`
        SELECT 
          COUNT(*)::int AS total_ventas,
          COALESCE(SUM(CASE WHEN estado = 'COMPLETADA' THEN total ELSE 0 END), 0)::float AS total_ingresos,
          COUNT(CASE WHEN estado = 'ANULADA' THEN 1 END)::int AS total_anuladas
        FROM public.ventas
      `);

      // 2. Estadísticas de productos
      const prodRes = await db.query(`
        SELECT 
          COUNT(*)::int AS total_productos,
          COUNT(CASE WHEN stock <= 0 THEN 1 END)::int AS productos_agotados,
          COUNT(CASE WHEN stock > 0 AND stock <= stock_minimo THEN 1 END)::int AS productos_stock_bajo,
          COALESCE(SUM(stock * precio), 0)::float AS valor_inventario
        FROM public.productos
        WHERE activo = TRUE
      `);

      // 3. Clientes
      const cliRes = await db.query(`
        SELECT 
          COUNT(*)::int AS total_clientes,
          COUNT(CASE WHEN activo = TRUE THEN 1 END)::int AS clientes_activos
        FROM public.clientes
      `);

      // 4. Últimas 5 ventas
      const ultimasVentasRes = await db.query(`
        SELECT 
          v.id_venta,
          c.nombre AS nombre_cliente,
          v.fecha,
          v.total::float AS total,
          v.estado
        FROM public.ventas v
        INNER JOIN public.clientes c ON v.id_cliente = c.id_cliente
        ORDER BY v.fecha DESC, v.id_venta DESC
        LIMIT 5
      `);

      res.json({
        exito: true,
        datos: {
          ventas: ventasRes.rows[0],
          inventario: prodRes.rows[0],
          clientes: cliRes.rows[0],
          ultimas_ventas: ultimasVentasRes.rows,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
