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
import passport from 'passport';

import appRoute from './routes/app.route';
import auditRoute from './routes/audit.route';
import domainRoute from './routes/domain.route';
import pageRoute from './routes/page.route';
import userRoute from './routes/user.route';
import groupRoute from './routes/group.route';
import { initPassport, createGuestGroup, createSuperuserGroup } from './core/permissions';

if (!process.env.ADMIN_PASSWORD)
  console.log('WARNING: You need to define a password in .env and recreate the containers with "docker-compose down" and "docker-compose up -d".');

// Web server setup
const app = express();
const PORT = process.env.NODE_ENV == 'production' ? 8080 :
  process.env.NODE_ENV == 'test' ? 3144 : 3143;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(logger('dev'));
app.use(session({
  secret: crypto.randomBytes(20).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax' },
}));

app.use(passport.initialize());
app.use(passport.session());
initPassport();

app.use('/api/app', appRoute);
app.use('/api/audits', auditRoute);
app.use('/api/domains', domainRoute);
app.use('/api/pages', pageRoute);
app.use('/api/users', userRoute);
app.use('/api/groups', groupRoute);

// in prod, send non-matched requests to React
// (React's proxy only works in dev)
if (process.env.NODE_ENV == 'production') {
  app.use(express.static(path.resolve(__dirname + '/../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../client/build/index.html'));
  });
}

// setup either HTTP or HTTPS
const sslKeyPath = '/app/certs/server.key';
const sslCertPath = '/app/certs/server.crt';
let server;
if (process.env.NODE_ENV == 'production' &&
    fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  const sslKey = fs.readFileSync(sslKeyPath, 'utf8');
  const sslCert = fs.readFileSync(sslCertPath, 'utf8');
  const credentials = { key: sslKey, cert: sslCert };
  const httpsServer = https.createServer(credentials, app);
  server = httpsServer.listen(8443, () => console.log(`HTTPS Listening on port 8443`));
} else {
  server = app.listen(PORT, () => console.log(`HTTP Listening on port ${PORT}`));
}

// Database setup
const mongooseConnectPromise = mongoose.connect(process.env.DB_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// create basic groups and the admin user if they don't exist
const dbReady = async () => {
  await mongooseConnectPromise;
  await Promise.all([createGuestGroup(), createSuperuserGroup()]);
};
if (process.env.NODE_ENV != 'test')
  dbReady();

export { app, server, dbReady };
