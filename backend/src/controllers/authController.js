const supabase = require('../services/supabaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/logger'); // Adjust the path as necessary

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const password_hash = await bcrypt.hash(password, 10);
  const role = req.body.role || 'citizen';
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password_hash, role }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Log the registration action
  logAction('User registered', { user_id: data.id, username: data.username });

  res.status(201).json({ id: data.id, username: data.username });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: data.id, username: data.username, role: data.role }, // <-- use userId
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Log the login action
  logAction('User login', { user_id: data.id, username: data.username });

  res.json({ token, username: data.username, role: data.role });
};