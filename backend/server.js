import 'regenerator-runtime/runtime'; // for babel
import path from 'path';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import fs from 'fs';
import https from 'https';

import appRoute from './routes/app.route';
import auditRoute from './routes/audit.route';
import domainRoute from './routes/domain.route';
import pageRoute from './routes/page.route';

if (!process.env.ADMIN_PASSWORD)
  console.log('WARNING: You need to define a password in .env and restart docker-compose.');

// Web server setup
const app = express();
const PORT = process.env.NODE_ENV == 'production' ? 80 : 3143;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(session({
  secret: crypto.randomBytes(20).toString('hex'),
  resave: false,
  saveUninitialized: false,
}));

app.use('/api/app', appRoute);
app.use('/api/audits', auditRoute);
app.use('/api/domains', domainRoute);
app.use('/api/pages', pageRoute);

// in prod, send non-matched requests to React
// (React's proxy only works in dev)
if (process.env.NODE_ENV == 'production') {
  app.use(express.static(path.resolve(__dirname + '/../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../client/build/index.html'));
  });
}

// setup either HTTP or HTTPS
const sslKeyPath = '/app/certs/server.key';
const sslCertPath = '/app/certs/server.crt';
if (process.env.NODE_ENV == 'production' &&
    fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  const sslKey = fs.readFileSync(sslKeyPath);
  const sslCert = fs.readFileSync(sslCertPath);
  const credentials = { key: sslKey, cert: sslCert };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, () => console.log(`HTTPS Listening on port 443`));
} else {
  app.listen(PORT, () => console.log(`HTTP Listening on port ${PORT}`));
}

// Database setup
mongoose.connect(process.env.DB_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
