const { Router } = require('express');
const clienteController = require('../controllers/clienteController');

const router = Router();

router.get('/', (req, res, next) => clienteController.listar(req, res, next));
router.get('/:id', (req, res, next) => clienteController.obtenerPorId(req, res, next));
router.post('/', (req, res, next) => clienteController.crear(req, res, next));
router.put('/:id', (req, res, next) => clienteController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => clienteController.eliminar(req, res, next));

module.exports = router;
