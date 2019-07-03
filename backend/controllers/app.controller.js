
exports.login = (req, res) => {
  const { password } = req.body;
  let admin = (password === process.env.ADMIN_PASSWORD);
  req.session.admin = admin;
  res.json({ success: true, data: admin });
};

exports.admin = (req, res) => {
  res.json({ success: true, data: req.session.admin ? true : false });
};
