const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;