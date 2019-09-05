import PageModel from '../models/page.model';

exports.get_page = (req, res) => {
  const { pageId } = req.params;
  if (typeof(pageId) != 'string' || !pageId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong page id" });
    return;
  }
  PageModel.findById(pageId).exec((err, page) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: page });
  });
};
