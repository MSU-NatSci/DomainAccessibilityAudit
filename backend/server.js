import "@babel/polyfill";
import path from 'path';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import appRoute from './routes/app.route';
import auditRoute from './routes/audit.route';
import domainRoute from './routes/domain.route';
import pageRoute from './routes/page.route';

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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// Database setup
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
