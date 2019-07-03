import mongoose from 'mongoose';
import Audit from '../core/audit';
import AuditModel from '../models/audit.model';
import DomainModel from '../models/domain.model';
import PageModel from '../models/page.model';

let currentAudit = null;

exports.get_audits = (req, res) => {
  AuditModel.find().collation({locale:'en', strength: 2})
    .sort('dateStarted')
    .exec((err, audits) => {
      if (err)
        res.json({ success: false, error: err.message });
      else
        res.json({ success: true, data: audits });
    });
};

exports.get_audit = (req, res) => {
  const { auditId } = req.params;
  if (!auditId) {
    res.json({ success: false, error: "No audit id provided" });
    return;
  }
  AuditModel.findById(auditId).populate('domains', '-violationStats').exec((err, audit) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: audit });
  });
};

exports.remove_audit = (req, res) => {
  const { auditId } = req.params;
  if (!auditId) {
    res.json({ success: false, error: "No audit id provided" });
    return;
  }
  if (!req.session.admin) {
    res.json({ success: false, error: "Admin priviledge is needed to remove audits." });
    return;
  }
  if (currentAudit != null && currentAudit.dbObject != null &&
      currentAudit.dbObject._id == auditId && currentAudit.running) {
    res.json({ success: false, error: "Can't remove a running audit." });
    return;
  }
  PageModel.deleteMany({auditId: auditId})
    .then(() => DomainModel.deleteMany({auditId: auditId}))
    .then(() => AuditModel.deleteOne({ _id: auditId }))
    .then(() => res.json({ success: true, data: {} }))
    .catch((err) => res.json({ success: false, error: err.message }));
};

/*
exports.get_audit_domains = (req, res) => {
  const { auditId } = req.params;
  if (!auditId) {
    res.json({ success: false, error: 'No audit id provided' });
    return;
  }
  DomainModel.find({auditId}).exec((err, domains) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: domains });
  });
};
*/

exports.status = (req, res) => {
  if (currentAudit != null)
    res.json({ success: true, data: currentAudit.status() });
  else
    res.json({ success: false, error: "No running audit" });
};

exports.start = (req, res) => {
  const { firstURL, standard, checkSubdomains, maxDepth, browser } = req.body;
  if (!firstURL) {
    res.json({ success: false, error: "Missing parameter: firstURL" });
    return;
  }
  if (!standard) {
    res.json({ success: false, error: "Missing parameter: standard" });
    return;
  }
  if (!browser) {
    res.json({ success: false, error: "Missing parameter: browser" });
    return;
  }
  if (!req.session.admin) {
    res.json({ success: false, error: "Admin priviledge is needed to create audits." });
    return;
  }
  if (currentAudit != null && currentAudit.running) {
    res.json({ success: false, error: "Another audit is running. Stop it first." });
    return;
  }
  currentAudit = new Audit();
  currentAudit.start(firstURL, standard, checkSubdomains, maxDepth, browser)
    .then((audit) => res.json({ success: true, data: audit }))
    .catch((err) => res.json({ success: false,
      error: typeof err == 'string' ? err : err.toString()}));
};

exports.stop = (req, res) => {
  if (!req.session.admin) {
    res.json({ success: false, error: "Admin priviledge is needed to stop audits." });
    return;
  }
  if (currentAudit != null && currentAudit.running)
    currentAudit.stop();
  res.json({ success: true, data: {} });
};
