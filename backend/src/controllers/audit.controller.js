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

exports.export_audit = async (req, res) => {
  const { auditId } = req.params;
  if (typeof(auditId) != 'string' || !auditId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong audit id" });
    return;
  }
  try {
    const audit = await AuditModel.findById(auditId).select('-_id').lean().exec();
    if (audit == null) {
      res.json({ success: false, error: "Audit not found !" });
      return;
    }
    if (!domainReadAllowed(req.user, audit.initialDomainName)) {
      res.json({ success: false, error: "You are not allowed to read this audit." });
      return;
    }
    // remove useless _id in audit violationStats
    for (const violation of Object.values(audit.violationStats)) {
      delete violation._id;
      for (const domain of violation.domains)
        delete domain._id;
    }
    const [domains, pages] = await Promise.all([
      DomainModel.find({ auditId }).select('-auditId -__v').lean().exec(),
      PageModel.find({ auditId }).select('-auditId -__v').lean().exec()
    ]);
    // remove useless _id in domains violationStats
    for (const domain of domains) {
      for (const violation of Object.values(domain.violationStats)) {
        delete violation._id;
        for (const page of violation.pages)
          delete page._id;
      }
    }
    const exportData = { audit, domains, pages };
    const dateStr = (new Date(audit.dateStarted)).toLocaleDateString()
      .replace(/\//g, '_');
    const fileName = audit.initialDomainName + '_' + dateStr + '.json';
    res.attachment(fileName);
    res.json(exportData);
  } catch (err) {
    res.set('Content-Type', 'text/plain');
    res.send(err.message);
  }
};

exports.import_audit = async (req, res) => {
  const { audit, domains, pages } = req.body;
  try {
    if (typeof(audit) != 'object') {
      res.json({ success: false, error: "Missing or wrong audit" });
      return;
    }
    if (!Array.isArray(domains)) {
      res.json({ success: false, error: "Missing or wrong domains" });
      return;
    }
    if (!Array.isArray(pages)) {
      res.json({ success: false, error: "Missing or wrong pages" });
      return;
    }
    if (!domainCreateAllowed(req.user, audit.initialDomainName)) {
      res.json({ success: false, error: "You are not allowed to import this audit." });
      return;
    }
    const savedAudit = await AuditModel.create(audit);
    const auditId = savedAudit._id;
    // save domains with new audit id
    for (const domain of domains)
      domain.auditId = auditId;
    const domainIds = domains.map(d => d._id);
    for (const domain of domains)
      delete domain._id;
    const savedDomains = await DomainModel.insertMany(domains);
    const newDomainId = {};
    for (let i=0; i<domains.length; i++)
      newDomainId[domainIds[i]] = savedDomains[i]._id;
    // fix links to domains from audit violationStats
    for (const violation of savedAudit.violationStats.values()) {
      for (const domain of violation.domains)
        domain.id = newDomainId[domain.id];
    }
    await savedAudit.save();
    // save pages with new audit id and domain id
    for (const page of pages) {
      page.auditId = auditId;
      page.domainId = newDomainId[page.domainId];
    }
    const pageIds = pages.map(p => p._id);
    for (const page of pages)
      delete page._id;
    const savedPages = await PageModel.insertMany(pages);
    const newPageId = {};
    for (let i=0; i<pages.length; i++)
      newPageId[pageIds[i]] = savedPages[i]._id;
    // fix links to pages from domain violationStats
    const ops = [];
    for (const domain of savedDomains) {
      for (const violation of domain.violationStats.values()) {
        for (const page of violation.pages) {
          page.id = newPageId[page.id];
        }
      }
      ops.push({
        updateOne: {
          filter: { _id: domain._id },
          update: {
            violationStats: domain.violationStats,
          },
        }
      });
    }
    await DomainModel.bulkWrite(ops);
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
