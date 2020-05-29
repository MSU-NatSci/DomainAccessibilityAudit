import passport from 'passport';

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (typeof(username) != 'string' || username == '') {
    res.json({ success: false, error: "Missing or wrong username" });
    return;
  }
  if (typeof(password) != 'string' || password == '') {
    res.json({ success: false, error: "Missing or wrong password" });
    return;
  }
  passport.authenticate('local', (err, user) => {
    if (err) {
      res.json({ success: false, error: err.message });
      return;
    }
    req.logIn(user, (err) => {
      if (err) {
        res.json({ success: false, error: err.message });
        return;
      }
      res.json({ success: true, data: user });
    });
  })(req, res);
};

exports.login_saml = (req, res) => {
  passport.authenticate('saml', {
    successRedirect: '/',
    failureRedirect: '/',
  })(req, res);
};

exports.login_callback = (req, res, next) => {
  const port = process.env.NODE_ENV == 'production' ? process.env.PRODUCTION_PORT :
    process.env.DEVELOPMENT_PORT;
  const portString = (req.protocol === 'https' || port === '80') ? '' : ':' + port;
  const redirectURL = req.protocol + '://' + req.hostname + portString;
  passport.authenticate('saml', (err, user) => {
    if (err) {
      req.session.authenticationError = "Authentication error: " + err.message;
      console.log(req.session.authenticationError);
      res.redirect(redirectURL);
      return;
    }
    req.logIn(user, (err) => {
      if (err) {
        req.session.authenticationError = "Authentication error: " + err.message;
        console.log(req.session.authenticationError);
      }
      res.redirect(redirectURL);
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout();
  res.json({ success: true, data: {} });
};
