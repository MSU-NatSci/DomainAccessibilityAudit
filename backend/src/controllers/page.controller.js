import { domainReadAllowed } from '../core/permissions';
import PageModel from '../models/page.model';
import Audit from '../core/audit';

exports.get_page = async (req, res) => {
  const { pageId } = req.params;
  if (typeof(pageId) != 'string' || !pageId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong page id" });
    return;
  }
  try {
    const page = await PageModel.findById(pageId);
    if (page == null) {
      res.json({ success: false, error: "Page not found !" });
      return;
    }
    const domainName = Audit.extractDomainNameFromURL(page.url);
    if (!domainReadAllowed(req.user, domainName)) {
      res.json({ success: false, error: "You are not allowed to read this page." });
      return;
    }
    res.json({ success: true, data: page });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
