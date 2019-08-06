import PageModel from '../models/page.model';

exports.get_page = (req, res) => {
  const { pageId } = req.params;
  if (!pageId) {
    res.json({ success: false, error: 'No page id provided' });
    return;
  }
  PageModel.findById(pageId).exec((err, page) => {
    if (err)
      res.json({ success: false, error: err.message });
    else
      res.json({ success: true, data: page });
  });
};
