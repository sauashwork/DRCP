const { body, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }),
    body('password').isLength({ min: 6 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.register
);

router.post('/login', authController.login);

module.exports = router;