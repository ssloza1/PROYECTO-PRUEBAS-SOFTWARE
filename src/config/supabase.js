require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kmahrxgfqplzggsjkwwo.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // Nota informativa para el desarrollador si aún no configura la REST API Key
  if (process.env.NODE_ENV !== 'test') {
    console.info(
      '[Supabase SDK] No se definió SUPABASE_SECRET_KEY en .env. Se usará la conexión directa PostgreSQL (db.js).'
    );
  }
}

module.exports = supabase;
