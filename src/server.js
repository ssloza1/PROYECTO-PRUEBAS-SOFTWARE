require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Probar conexión inicial a PostgreSQL / Supabase
    const res = await db.query('SELECT NOW() AS hora_servidor, current_database() AS bd');
    console.log(`[DB] Conectado exitosamente a Supabase (${res.rows[0].bd}) a las ${res.rows[0].hora_servidor}`);

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` SISTEMA DE INVENTARIO Y VENTAS`);
      console.log(` Servidor activo en: http://localhost:${PORT}`);
      console.log(` API Health Check:   http://localhost:${PORT}/api/health`);
      console.log(` Entorno:            ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    // Manejo de apagado graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n[Server] Señal ${signal} recibida. Cerrando conexiones...`);
      server.close(async () => {
        await db.closePool();
        console.log('[Server] Pool de base de datos cerrado. Servidor detenido.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('[Error Crítico] No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
}

bootstrap();
