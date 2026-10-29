const ventaService = require('../services/ventaService');

class VentaController {
  async listar(req, res, next) {
    try {
      const filtros = {
        id_cliente: req.query.id_cliente ? Number(req.query.id_cliente) : undefined,
        estado: req.query.estado ? req.query.estado.toUpperCase() : undefined,
      };
      const ventas = await ventaService.listarVentas(filtros);
      res.json({ exito: true, total: ventas.length, datos: ventas });
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const venta = await ventaService.obtenerPorId(req.params.id);
      res.json({ exito: true, datos: venta });
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nuevaVenta = await ventaService.registrarVenta(req.body);
      res.status(201).json({
        exito: true,
        mensaje: 'Venta registrada exitosamente',
        datos: nuevaVenta,
      });
    } catch (err) {
      next(err);
    }
  }

  async anular(req, res, next) {
    try {
      const resultado = await ventaService.anularVenta(req.params.id);
      res.json({
        exito: true,
        mensaje: resultado.mensaje,
        datos: resultado.venta,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VentaController();
