import { filterAudits, domainCreateAllowed, domainReadAllowed, domainDeleteAllowed } from '../core/permissions';
import Audit from '../core/audit';
import AuditModel from '../models/audit.model';
import DomainModel from '../models/domain.model';
import PageModel from '../models/page.model';

let runningAudits = [];

const getRunningAudit = (auditId) => {
  for (const audit of runningAudits)
    if (audit.dbObject != null && audit.dbObject.id === auditId)
      return audit;
  return null;
};
const cleanupRunningAudits = () => {
  // release references to audits that are not running anymore
  runningAudits = runningAudits.filter((a) => a.running);
};

exports.get_audits = async (req, res) => {
  try {
    let audits = await AuditModel.find()
      .select('initialDomainName dateStarted nbCheckedURLs nbViolations')
      .collation({locale:'en', strength: 2})
      .sort({dateStarted: -1})
      .lean()
      .exec();
    audits = await filterAudits(req.user, audits);
    res.json({ success: true, data: audits });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.get_audit = async (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  try {
    const audit = await AuditModel.findById(auditId).populate({
      path: 'domains',
      select: 'name nbCheckedURLs nbViolations',
      options: { sort: { name: 1 } },
    }).lean().exec();
    if (audit == null) {
      res.json({ success: false, error: "Audit not found !" });
      return;
    }
    //await filterAudit(req.user, audit);
    if (!domainReadAllowed(req.user, audit.initialDomainName)) {
      res.json({ success: false, error: "You are not allowed to read this audit." });
      return;
    }
    res.json({ success: true, data: audit });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.start = async (req, res) => {
  const { firstURL, standard, checkSubdomains, maxDepth,
    maxPagesPerDomain, sitemaps, includeMatch, browser, postLoadingDelay } = req.body;
  if (req.user == null) {
    res.json({ success: false, error: "Authentication is needed to create audits." });
    return;
  }
  const initialDomainName = Audit.extractDomainNameFromURL(firstURL);
  if (!domainCreateAllowed(req.user, initialDomainName)) {
    res.json({ success: false, error: "No permission to create this audit." });
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
  if (typeof(postLoadingDelay) != 'number') {
    res.json({ success: false, error: "Missing or wrong parameter: postLoadingDelay" });
    return;
  }
  cleanupRunningAudits();
  const newAudit = new Audit();
  runningAudits.push(newAudit);
  try {
    const audit = await newAudit.start({ firstURL, standard, checkSubdomains,
      maxDepth, maxPagesPerDomain, sitemaps, includeMatch, browser, postLoadingDelay });
    res.json({ success: true, data: audit });
  } catch (err) {
    res.json({ success: false,
      error: typeof err == 'string' ? err : err.toString()});
  }
};

exports.stop = (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  const rAudit = getRunningAudit(auditId);
  if (rAudit == null) {
    res.json({ success: false, error:
      "Could not find the audit, maybe it's not running anymore." });
    return;
  }
  if (!domainCreateAllowed(req.user, rAudit.initialDomainName)) {
    res.json({ success: false, error: "You are not allowed to stop this audit." });
    return;
  }
  if (rAudit.running)
    rAudit.stop();
  res.json({ success: true, data: {} });
};

exports.remove_audit = async (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  if (req.user == null) {
    res.json({ success: false, error: "Authentication is needed to remove audits." });
    return;
  }
  const rAudit = getRunningAudit(auditId);
  if (rAudit != null && rAudit.running) {
    res.json({ success: false, error: "Can't remove a running audit." });
    return;
  }
  const audit = await AuditModel.findById(auditId);
  if (!domainDeleteAllowed(req.user, audit.initialDomainName)) {
    res.json({ success: false, error: "No permission to remove this audit." });
    return;
  }
  try {
    await PageModel.deleteMany({auditId: auditId});
    await DomainModel.deleteMany({auditId: auditId});
    await AuditModel.deleteOne({ _id: auditId });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.get_audit_status = (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  const rAudit = getRunningAudit(auditId);
  if (rAudit == null) {
    res.json({ success: false, error:
      "Could not find the audit, maybe it's not running anymore." });
    return;
  }
  if (!domainReadAllowed(req.user, rAudit.initialDomainName)) {
    res.json({ success: false, error: "You are not allowed to read this audit." });
    return;
  }
  res.json({ success: true, data: rAudit.status() });
};
