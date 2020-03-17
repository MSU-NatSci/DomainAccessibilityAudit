import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import request from 'supertest';
import { app, server, dbReady } from '../server';

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await server.close();
  await mongoose.connection.close();
});
beforeAll(dbReady);

let groupId, userId, tu, tg, auditId;
const testURL = 'http://localhost:' + server.address().port + '/';


describe("checks login and logout", () => {
  const agent = request.agent(app); // to pass session cookies
  
  it("verifies a guest user can't create an audit", async () => {
    await agent
      .post('/api/audits/start')
      .send({
        firstURL: testURL,
        standard: 'wcag2aa',
        checkSubdomains: false,
        maxDepth: 1,
        maxPagesPerDomain: 0,
        sitemaps: false,
        includeMatch: '',
        browser: 'firefox',
        postLoadingDelay: 0,
      })
      .expect('Content-Type', /json/)
      .expect(200, {
        success: false,
        error: "Authentication is needed to create audits.",
      });
  });
  
  it("logs in as admin", async () => {
    const res = await agent
      .post('/api/app/login')
      .send({
        username: 'admin',
        password: 'password',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        username: 'admin',
        groups: [
          {
            name: 'Superusers',
            permissions: {
              createAllAudits: true,
              readAllAudits: true,
              deleteAllAudits: true,
              editUsersAndGroups: true,
            }
          }
        ],
      }
    });
  });
  
  it("logs out", async () => {
    await agent
      .post('/api/app/logout')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
});

describe("Users and groups endpoints", () => {
  app.use(express.static(path.resolve(__dirname + '/www'))); // test website
  const agent = request.agent(app); // to pass session cookies
    
  it("checks a group can't be created without login", async () => {
    await agent
      .post('/api/groups/')
      .send({
        name: "test group",
        permissions: {
          createAllAudits: false,
          readAllAudits: true,
          deleteAllAudits: false,
          editUsersAndGroups: false,
          domains: [],
        },
      })
      .expect('Content-Type', /json/)
      .expect(200, {
        success: false,
        error: "You are not allowed to create a new group.",
      });
  });
  
  it("logs in as admin", async () => {
    const res = await agent
      .post('/api/app/login')
      .send({
        username: 'admin',
        password: 'password',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        username: 'admin',
      }
    });
  });
  
  it("creates a group", async () => {
    tg = {
      name: "test group",
      permissions: {
        createAllAudits: false,
        readAllAudits: true,
        deleteAllAudits: false,
        editUsersAndGroups: false,
        domains: [],
      },
    };
    const res = await agent
      .post('/api/groups/')
      .send(tg)
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body).toMatchObject({
      success: true,
      data: tg,
    });
    groupId = res.body.data._id;
    expect(groupId).toBeTruthy();
    tg = res.body.data;
  });
  
  it("modifies the group", async () => {
    tg.permissions.domains = [
      {
        name: 'localhost',
        create: true,
        read: true,
        delete: true,
      }
    ];
    const res = await agent
      .put('/api/groups/' + groupId)
      .send(tg)
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body).toMatchObject({
      success: true,
      data: {},
    });
  });
  
  it("creates a user", async () => {
    tu = {
      username: 'testuser',
      firstname: 'test',
      lastname: 'user',
      password: 'test',
    };
    const res = await agent
      .post('/api/users/')
      .send(tu)
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    delete tu.password;
    expect(res.body).toMatchObject({
      success: true,
      data: tu,
    });
    userId = res.body.data._id;
    expect(userId).toBeTruthy();
    tu._id = userId;
  });
  
  it("modifies the user", async () => {
    tu.lastname = 'User';
    const res = await agent
      .put('/api/users/' + userId)
      .send(tu)
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body).toMatchObject({
      success: true,
      data: {},
    });
  });
  
  it("adds the user to the group", async () => {
    await agent
      .put('/api/groups/' + groupId + '/users/' + userId)
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
  it("checks the group contains the user", async () => {
    const res = await agent
      .get('/api/groups/' + groupId)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body.data.users[0]._id).toBe(userId);
  });
  
  it("checks the user has the group", async () => {
    const res = await agent
      .get('/api/users/' + userId)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.success).toBe(true);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body.data.groups[0]._id).toBe(groupId);
  });
  
  it("logs out", async () => {
    await agent
      .post('/api/app/logout')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
  it("logs in as new test user", async () => {
    const res = await agent
      .post('/api/app/login')
      .send({
        username: 'testuser',
        password: 'test',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        username: 'testuser',
      }
    });
  });
  
  it("checks there is not audit initially", async () => {
    await request(app)
      .get('/api/audits/')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: [],
      });
  });
  
  it("starts an audit", async () => {
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
        browser: 'firefox',
        postLoadingDelay: 0,
      })
      .expect('Content-Type', /json/)
      .expect(200);
    if (!res.body.success)
      console.error(res.body.error);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    auditId = res.body.data._id;
    expect(auditId).toBeTruthy();
  });
  
  it("stops the audit", async () => {
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
      if (!res.body.success)
        console.error(res.body.error);
      expect(res.body.success).toBe(true);
      running = res.body.data.running;
    }
  }, 10000); // 10s timeout
  
  it("deletes the audit", async () => {
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
  
  it("logs out", async () => {
    await agent
      .post('/api/app/logout')
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
  it("logs in as admin", async () => {
    const res = await agent
      .post('/api/app/login')
      .send({
        username: 'admin',
        password: 'password',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        username: 'admin',
      }
    });
  });
  
  it("deletes the test user", async () => {
    await agent
      .delete('/api/users/' + userId)
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
  it("deletes the test group", async () => {
    await agent
      .delete('/api/groups/' + groupId)
      .expect('Content-Type', /json/)
      .expect(200, {
        success: true,
        data: {},
      });
  });
  
});
