// Simple mock authentication using a header: x-user-id and x-user-role

const users = {
  netrunnerX: { id: 'netrunnerX', role: 'admin' },
  reliefAdmin: { id: 'reliefAdmin', role: 'admin' },
  citizen1: { id: 'citizen1', role: 'contributor' },
  volunteer2: { id: 'volunteer2', role: 'contributor' }
};

module.exports = (req, res, next) => {
  const userId = req.header('x-user-id');
  if (!userId || !users[userId]) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing user' });
  }
  req.user = users[userId];
  next();
};