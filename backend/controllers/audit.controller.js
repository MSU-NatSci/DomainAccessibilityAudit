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
let cleanupRunningAudits = () => {
  // release references to audits that are not running anymore
  runningAudits = runningAudits.filter((a) => a.running);
}

exports.get_audits = (req, res) => {
  AuditModel.find().collation({locale:'en', strength: 2})
    .sort({dateStarted: -1})
    .exec((err, audits) => {
      if (err)
        res.json({ success: false, error: err.message });
      else
        res.json({ success: true, data: audits });
    });
};

exports.get_audit = (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  AuditModel.findById(auditId).populate({
        path: 'domains',
        select: '-violationStats',
        options: { sort: { name: 1 } },
      }).exec((err, audit) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: audit });
  });
};

exports.start = (req, res) => {
  const { firstURL, standard, checkSubdomains, maxDepth,
    maxPagesPerDomain, sitemaps, includeMatch, browser } = req.body;
  if (!req.session.admin) {
    res.json({ success: false, error: "Admin priviledge is needed to create audits." });
    return;
  }
  if (typeof(firstURL) != 'string') {
    res.json({ success: false, error: "Missing or wrong parameter: firstURL" });
    return;
  }
  if (typeof(standard) != 'string' ||
      ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'].indexOf(standard) == -1) {
    res.json({ success: false, error: "Missing or wrong parameter: standard" });
    return;
  }
  if (typeof(checkSubdomains) != 'boolean') {
    res.json({ success: false, error: "Missing or wrong parameter: checkSubdomains" });
    return;
  }
  if (typeof(maxDepth) != 'number') {
    res.json({ success: false, error: "Missing or wrong parameter: maxDepth" });
    return;
  }
  if (typeof(maxPagesPerDomain) != 'number') {
    res.json({ success: false, error: "Missing or wrong parameter: maxPagesPerDomain" });
    return;
  }
  if (typeof(sitemaps) != 'boolean') {
    res.json({ success: false, error: "Missing or wrong parameter: sitemaps" });
    return;
  }
  if (typeof(includeMatch) != 'string') {
    res.json({ success: false, error: "Missing or wrong parameter: includeMatch" });
    return;
  }
  if (includeMatch != '') {
    try {
      new RegExp(includeMatch);
    } catch (e) {
      res.json({ success: false, error: "Bad regular expression: includeMatch" });
      return;
    }
  }
  if (typeof(browser) != 'string' || ['firefox', 'chrome'].indexOf(browser) == -1) {
    res.json({ success: false, error: "Missing or wrong parameter: browser" });
    return;
  }
  cleanupRunningAudits();
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
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
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
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
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
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  let audit = getRunningAudit(auditId);
  if (audit == null)
    res.json({ success: false, error:
      "Could not find the audit, maybe it's not running anymore." });
  else
    res.json({ success: true, data: audit.status() });
};
