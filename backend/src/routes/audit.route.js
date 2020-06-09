import express from 'express';

import controller from '../controllers/audit.controller';

const router = express.Router();

router.get('/', controller.get_audits);
router.post('/start', controller.start);
router.post('/import', controller.import_audit);
router.get('/:auditId/export', controller.export_audit);
router.get('/:auditId/status', controller.get_audit_status);
router.post('/:auditId/stop', controller.stop);
router.get('/:auditId', controller.get_audit);
router.delete('/:auditId', controller.remove_audit);
//router.get('/:auditId/domains', controller.get_audit_domains);

module.exports = router;
