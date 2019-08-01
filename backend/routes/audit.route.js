const express = require('express');
const router = express.Router();

const audit_controller = require('../controllers/audit.controller');

router.get('/', audit_controller.get_audits);
router.post('/start', audit_controller.start);
router.get('/:auditId/status', audit_controller.get_audit_status);
router.post('/:auditId/stop', audit_controller.stop);
router.get('/:auditId', audit_controller.get_audit);
router.delete('/:auditId', audit_controller.remove_audit);
//router.get('/:auditId/domains', audit_controller.get_audit_domains);

module.exports = router;
