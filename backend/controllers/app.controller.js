
exports.login = (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.json({ success: false, error: "No password provided" });
    return;
  }
  let admin = (password === process.env.ADMIN_PASSWORD);
  req.session.admin = admin;
  res.json({ success: true, data: admin });
};

exports.logout = (req, res) => {
  req.session.admin = false;
  res.json({ success: true, data: {} });
};

exports.admin = (req, res) => {
  res.json({ success: true, data: req.session.admin ? true : false });
};
