const supabase = require('./supabaseService');
const { logAction } = require('../utils/logger'); // Assuming you have a logger service

exports.getCache = async (key) => {
  const { data, error } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', key)
    .single();

  if (error || !data) {
    logAction('Cache miss', { key });
    return null;
  }
  if (new Date(data.expires_at) < new Date()) {
    logAction('Cache expired', { key });
    return null;
  }
  logAction('Cache hit', { key });
  return data.value;
};

exports.setCache = async (key, value, ttlSeconds = 3600) => {
  const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabase
    .from('cache')
    .upsert([{ key, value, expires_at }]);
};