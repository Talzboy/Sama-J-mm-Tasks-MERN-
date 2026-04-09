process.env.JWT_SECRET = 'test-secret-key';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDatabase();
});

test.after(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

test.beforeEach(() => {
  return Promise.all([Task.deleteMany({}), User.deleteMany({})]);
});

test('register, login, and fetch current user', async () => {
  const registerResponse = await request(app).post('/api/auth/register').send({
    username: 'alice',
    email: 'alice@example.com',
    password: 'secret123',
  });

  assert.equal(registerResponse.status, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.username, 'alice');

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'alice@example.com',
    password: 'secret123',
  });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token);
  assert.equal(loginResponse.body.user.email, 'alice@example.com');

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginResponse.body.token}`);

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.user.username, 'alice');
  assert.equal(meResponse.body.user.email, 'alice@example.com');
});

test('reject duplicate email registration', async () => {
  const payload = {
    username: 'bob',
    email: 'bob@example.com',
    password: 'secret123',
  };

  const first = await request(app).post('/api/auth/register').send(payload);
  const second = await request(app).post('/api/auth/register').send({
    ...payload,
    username: 'bob2',
  });

  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
  assert.equal(second.body.error, 'Email already in use');
});

test('reject login with invalid password', async () => {
  await request(app).post('/api/auth/register').send({
    username: 'david',
    email: 'david@example.com',
    password: 'secret123',
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'david@example.com',
    password: 'wrongpass',
  });

  assert.equal(loginResponse.status, 401);
  assert.equal(loginResponse.body.error, 'Invalid credentials');
});

test('protect /me endpoint when token is missing', async () => {
  const meResponse = await request(app).get('/api/auth/me');

  assert.equal(meResponse.status, 401);
  assert.equal(meResponse.body.error, 'Access token required');
});
