// Importar la configuración base de reglas recomendadas por ESLint para JavaScript
const js = require('@eslint/js');
// Importar los conjuntos de variables globales (node, jest, browser)
const globals = require('globals');

// Reglas propias del laboratorio, reutilizadas en todos los bloques
const reglasLab = {
  // Se ignoran los argumentos que empiezan con guion bajo (ej. _next en el middleware de errores)
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  // Obligatorio usar punto y coma al final de cada sentencia
  'semi': ['error', 'always'],
  // Obligatorio usar comillas simples (se permiten plantillas con backticks para SQL)
  'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
};

// Exportar un arreglo de configuraciones para manejo de ESLint
module.exports = [
  {
    // Carpetas que ESLint no debe revisar
    ignores: ['**/node_modules/**', '**/coverage/**'],
  },
  {
    // Código de la API (Node.js)
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: { ...js.configs.recommended.rules, ...reglasLab },
  },
  {
    // Pruebas (Node.js + Jest)
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: { ...js.configs.recommended.rules, ...reglasLab },
  },
  {
    // Frontend (navegador)
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: { ...js.configs.recommended.rules, ...reglasLab },
  },
];
