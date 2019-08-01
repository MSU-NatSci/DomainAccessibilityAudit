import mongoose from 'mongoose';
import Audit from '../core/audit';
import AuditModel from '../models/audit.model';
import DomainModel from '../models/domain.model';
import PageModel from '../models/page.model';

let runningAudits = [];

let getRunningAudit = (auditId) => {
  for (let audit of runningAudits)
    if (audit.dbObject != null && audit.dbObject.id === auditId)
      return audit;
  return null;
}

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

exports.start = (req, res) => {
  const { firstURL, standard, checkSubdomains, maxDepth,
    maxPagesPerDomain, sitemaps, includeMatch, browser } = req.body;
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
  let newAudit = new Audit();
  runningAudits.push(newAudit);
  newAudit.start(firstURL, standard, checkSubdomains, maxDepth,
      maxPagesPerDomain, sitemaps, includeMatch, browser)
    .then((audit) => res.json({ success: true, data: audit }))
    .catch((err) => {
      console.log(err);
      res.json({ success: false,
        error: typeof err == 'string' ? err : err.toString()});
    });
};

exports.stop = (req, res) => {
  const { auditId } = req.params;
  if (!req.session.admin) {
    res.json({ success: false, error: "Admin priviledge is needed to stop audits." });
    return;
  }
  if (!auditId) {
    res.json({ success: false, error: 'No audit id provided' });
    return;
  }
  let audit = getRunningAudit(auditId);
  if (audit == null) {
    res.json({ success: false, error:
      "Could not find the audit, maybe it's not running anymore." });
    return;
  }
  if (audit.running)
    audit.stop();
  res.json({ success: true, data: {} });
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
  let audit = getRunningAudit(auditId);
  if (audit != null && audit.running) {
    res.json({ success: false, error: "Can't remove a running audit." });
    return;
  }
  PageModel.deleteMany({auditId: auditId})
    .then(() => DomainModel.deleteMany({auditId: auditId}))
    .then(() => AuditModel.deleteOne({ _id: auditId }))
    .then(() => res.json({ success: true, data: {} }))
    .catch((err) => res.json({ success: false, error: err.message }));
};

exports.get_audit_status = (req, res) => {
  const { auditId } = req.params;
  if (!auditId) {
    res.json({ success: false, error: 'No audit id provided' });
    return;
  }
  let audit = getRunningAudit(auditId);
  if (audit == null)
    res.json({ success: false, error:
      "Could not find the audit, maybe it's not running anymore." });
  else
    res.json({ success: true, data: audit.status() });
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
