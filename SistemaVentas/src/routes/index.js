const { Router } = require('express');
const productoRoutes = require('./productoRoutes');
const clienteRoutes = require('./clienteRoutes');
const ventaRoutes = require('./ventaRoutes');
const catalogoRoutes = require('./catalogoRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = Router();

// Health check endpoint (ideal para pruebas de integración y monitoreo)
router.get('/health', (req, res) => {
  res.json({
    exito: true,
    estado: 'UP',
    mensaje: 'API del Sistema de Inventario y Ventas operativa',
    timestamp: new Date().toISOString(),
  });
});

router.use('/productos', productoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/ventas', ventaRoutes);
router.use('/catalogos', catalogoRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
