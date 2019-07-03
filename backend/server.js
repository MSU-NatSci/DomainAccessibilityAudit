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
const API_PORT = process.env.API_PORT || 3143;

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

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));

// Database setup
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
