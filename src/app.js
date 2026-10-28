const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('node:path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.disable('x-powered-by');

// Middlewares globales
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Servir archivos estáticos del frontend (Dashboard interactivo)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API REST
app.use('/api', routes);

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
