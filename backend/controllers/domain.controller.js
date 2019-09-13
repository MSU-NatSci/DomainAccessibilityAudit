import DomainModel from '../models/domain.model';

exports.get_domain = (req, res) => {
  const { domainId } = req.params;
  if (typeof(domainId) != 'string' || !domainId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong domain id" });
    return;
  }
  DomainModel.findById(domainId).populate({
      path: 'pages',
      select: '-violations',
      options: { sort: { nbViolations: -1, url: 1 } },
    }).exec((err, domain) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: domain });
  });
};
