const { Router } = require('express');
const productoController = require('../controllers/productoController');

const router = Router();

router.get('/', (req, res, next) => productoController.listar(req, res, next));
router.get('/:id', (req, res, next) => productoController.obtenerPorId(req, res, next));
router.post('/', (req, res, next) => productoController.crear(req, res, next));
router.put('/:id', (req, res, next) => productoController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => productoController.eliminar(req, res, next));

module.exports = router;
