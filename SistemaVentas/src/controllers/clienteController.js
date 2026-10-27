const clienteService = require('../services/clienteService');

class ClienteController {
  async listar(req, res, next) {
    try {
      const filtros = {
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        busqueda: req.query.q,
      };
      const clientes = await clienteService.listarClientes(filtros);
      res.json({ exito: true, total: clientes.length, datos: clientes });
    } catch (err) {
      next(err);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const cliente = await clienteService.obtenerPorId(req.params.id);
      res.json({ exito: true, datos: cliente });
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const nuevo = await clienteService.registrarCliente(req.body);
      res.status(201).json({ exito: true, mensaje: 'Cliente registrado exitosamente', datos: nuevo });
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const actualizado = await clienteService.actualizarCliente(req.params.id, req.body);
      res.json({ exito: true, mensaje: 'Cliente actualizado exitosamente', datos: actualizado });
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const desactivado = await clienteService.desactivarCliente(req.params.id);
      res.json({ exito: true, mensaje: 'Cliente desactivado exitosamente', datos: desactivado });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClienteController();
