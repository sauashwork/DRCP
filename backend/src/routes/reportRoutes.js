const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');
const roleCheck = require('../middleware/roleCheck');
const reportController = require('../controllers/reportController');

// All users can submit and view reports
router.use(jwtAuth);

router.post('/', reportController.createReport);
router.get('/:disaster_id', reportController.getReportsByDisaster);

// Admin only: update and delete
router.put('/:id', roleCheck(['admin']), reportController.updateReport);
router.delete('/:id', roleCheck(['admin']), reportController.deleteReport);

module.exports = router;