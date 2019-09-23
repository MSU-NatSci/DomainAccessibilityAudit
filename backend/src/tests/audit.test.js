import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import request from 'supertest';
import { app, server, mongooseConnectPromise } from '../server';

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await server.close();
  await mongoose.connection.close();
});
beforeAll(() => mongooseConnectPromise);

let auditId, domainId, pageId;

describe('App Endpoints', () => {
  const agent = request.agent(app); // to pass session cookies
  
  it('verifies admin is not logged in initially', async () => {
    await agent
      .get('/api/app/admin')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: false,
      });
  });
  it('logs in', async () => {
    await agent
      .post('/api/app/login')
      .send({password: 'password'})
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: true,
      });
  });
  it('verifies admin is logged in', async () => {
    await agent
      .get('/api/app/admin')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: true,
      });
  });
  it('logs out', async () => {
    await agent
      .post('/api/app/logout')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  it('verifies admin is not logged in anymore', async () => {
    await agent
      .get('/api/app/admin')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: false,
      });
  });
});

describe('Audit Endpoints', () => {
  // test website
  app.use(express.static(path.resolve(__dirname + '/www')));
  const testURL = 'http://localhost:' + server.address().port + '/';
  
  it('gets a test site file', async () => {
    await request(app)
      .get('/index.html')
      .expect('Content-Type', /^text\/html/)
      .expect(200);
  });
  it('lists the audits (no login required)', async () => {
    await request(app)
      .get('/api/audits/')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: [],
      });
  });
  const agent = request.agent(app); // to pass session cookies
  it('logs in', async () => {
    await agent
      .post('/api/app/login')
      .send({password: 'password'})
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: true,
      });
  });
  it('starts an audit', async () => {
    const res = await agent
      .post('/api/audits/start')
      .send({
        firstURL: testURL,
        standard: 'wcag2aa',
        checkSubdomains: false,
        maxDepth: 1,
        maxPagesPerDomain: 0,
        sitemaps: false,
        includeMatch: '',
        browser: 'firefox'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    auditId = res.body.data._id;
  });
  it('stops an audit', async () => {
    expect(auditId).toBeTruthy();
    await agent
      .post('/api/audits/' + auditId + '/stop')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
    let running = true;
    while (running) {
      // keep polling the audit until it stops
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = await agent
        .get('/api/audits/' + auditId + '/status')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.success).toBe(true);
      running = res.body.data.running;
    }
  }, 5000); // 5s timeout
  it('deletes an audit', async () => {
    expect(auditId).toBeTruthy();
    await agent
      .delete('/api/audits/' + auditId)
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
    await request(app)
      .get('/api/audits/')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: [],
      });
  }, 5000); // 5s timeout
  it('starts another audit', async () => {
    const res = await agent
      .post('/api/audits/start')
      .send({
        firstURL: testURL,
        standard: 'wcag2aa',
        checkSubdomains: false,
        maxDepth: 1,
        maxPagesPerDomain: 0,
        sitemaps: false,
        includeMatch: '',
        browser: 'firefox'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    auditId = res.body.data._id;
  });
  it('completes the audit, with correct results', async () => {
    expect(auditId).toBeTruthy();
    let running = true;
    let res;
    while (running) {
      // keep polling the audit until it stops
      await new Promise(resolve => setTimeout(resolve, 500));
      res = await agent
        .get('/api/audits/' + auditId + '/status')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.success).toBe(true);
      running = res.body.data.running;
    }
    expect(res.body.data.nbCheckedURLs).toBe(2);
    expect(res.body.data.nbViolations).toBe(8);
    // get the results
    res = await request(app)
      .get('/api/audits/' + auditId)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complete).toBe(true);
    expect(res.body.data).toHaveProperty('violationStats');
    const violationStats = res.body.data.violationStats;
    expect(violationStats).toHaveProperty('bypass');
    expect(violationStats).toHaveProperty('document-title');
    expect(violationStats).toHaveProperty('html-has-lang');
    expect(violationStats).toHaveProperty('image-alt');
    expect(violationStats).toHaveProperty('label');
    expect(violationStats).toHaveProperty('listitem');
    domainId = res.body.data.domains[0]._id;
  }, 5000); // 5s timeout
});

describe('Domain Endpoints', () => {
  it('gets the domain data', async () => {
    expect(domainId).toBeTruthy();
    const res = await request(app)
      .get('/api/domains/' + domainId)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nbCheckedURLs).toBe(2);
    expect(res.body.data.nbViolations).toBe(8);
    expect(res.body.data.violationStats).toHaveProperty('bypass');
    expect(res.body.data.pages.length).toBe(2);
    pageId = res.body.data.pages[0]._id;
  });
});

describe('Page Endpoints', () => {
  it('gets the page data', async () => {
    expect(pageId).toBeTruthy();
    const res = await request(app)
      .get('/api/pages/' + pageId)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.auditId).toBe(auditId);
    expect(res.body.data.domainId).toBe(domainId);
    expect(res.body.data.status).toBe('200');
    expect(res.body.data.nbViolations).toBe(5);
    expect(res.body.data.violations.length).toBe(5);
  });
});
