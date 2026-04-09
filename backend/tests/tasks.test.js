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

async function createUserAndToken(username, email) {
  await request(app).post('/api/auth/register').send({
    username,
    email,
    password: 'secret123',
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email,
    password: 'secret123',
  });

  return loginResponse.body.token;
}

test.beforeEach(() => {
  return Promise.all([Task.deleteMany({}), User.deleteMany({})]);
});

test('users only see their own tasks', async () => {
  const tokenA = await createUserAndToken('alice', 'alice@example.com');
  const tokenB = await createUserAndToken('bob', 'bob@example.com');

  await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({
    title: 'Alice Task',
    description: 'Private task',
    priority: 'high',
  });

  await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenB}`).send({
    title: 'Bob Task',
    description: 'Another private task',
    priority: 'low',
  });

  const listA = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenA}`);
  const listB = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenB}`);

  assert.equal(listA.status, 200);
  assert.equal(listB.status, 200);
  assert.equal(listA.body.tasks.length, 1);
  assert.equal(listB.body.tasks.length, 1);
  assert.equal(listA.body.tasks[0].title, 'Alice Task');
  assert.equal(listB.body.tasks[0].title, 'Bob Task');
});

test('create and list task shows title, status, and deadline', async () => {
  const token = await createUserAndToken('mariama', 'mariama@example.com');

  const createResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prepare presentation',
      description: 'Slides for project review',
      deadline: '2026-05-10',
    });

  assert.equal(createResponse.status, 201);

  const listResponse = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.tasks.length, 1);
  assert.equal(listResponse.body.tasks[0].title, 'Prepare presentation');
  assert.equal(listResponse.body.tasks[0].status, 'pending');
  assert.ok(listResponse.body.tasks[0].deadline.includes('2026-05-10'));
});

test('create, update, and delete task', async () => {
  const token = await createUserAndToken('charlie', 'charlie@example.com');

  const createResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Finish report',
      description: 'Quarterly performance report',
      priority: 'medium',
      deadline: '2026-04-30',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.task.title, 'Finish report');
  assert.ok(createResponse.body.task.deadline.includes('2026-04-30'));

  const taskId = createResponse.body.task.id;

  const updateResponse = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'completed',
      priority: 'high',
    });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.task.status, 'completed');
  assert.equal(updateResponse.body.task.priority, 'high');

  const deleteResponse = await request(app)
    .delete(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(deleteResponse.status, 200);

  const listResponse = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.tasks.length, 0);
});

test('update task details (title, description, deadline) is persisted in listing', async () => {
  const token = await createUserAndToken('awa', 'awa@example.com');

  const createResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Initial title',
      description: 'Initial description',
      deadline: '2026-06-01',
    });

  const taskId = createResponse.body.task.id;

  const updateResponse = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Updated title',
      description: 'Updated description',
      deadline: '2026-06-15',
    });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.task.title, 'Updated title');
  assert.equal(updateResponse.body.task.description, 'Updated description');
  assert.ok(updateResponse.body.task.deadline.includes('2026-06-15'));

  const listResponse = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.tasks.length, 1);
  assert.equal(listResponse.body.tasks[0].title, 'Updated title');
  assert.equal(listResponse.body.tasks[0].description, 'Updated description');
  assert.ok(listResponse.body.tasks[0].deadline.includes('2026-06-15'));
});

test('reject invalid update payloads for task', async () => {
  const token = await createUserAndToken('fatou', 'fatou@example.com');

  const createResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Valid task' });

  const taskId = createResponse.body.task.id;

  const emptyTitleUpdate = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: '   ' });

  assert.equal(emptyTitleUpdate.status, 400);
  assert.equal(emptyTitleUpdate.body.error, 'Title cannot be empty');

  const invalidDeadlineUpdate = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ deadline: 'not-a-date' });

  assert.equal(invalidDeadlineUpdate.status, 400);
  assert.equal(invalidDeadlineUpdate.body.error, 'Invalid deadline value');
});

test('protect task endpoints when token is missing', async () => {
  const listResponse = await request(app).get('/api/tasks');
  assert.equal(listResponse.status, 401);

  const createResponse = await request(app).post('/api/tasks').send({ title: 'No token task' });
  assert.equal(createResponse.status, 401);
});

test('prevent one user from mutating another user task', async () => {
  const ownerToken = await createUserAndToken('owner', 'owner@example.com');
  const intruderToken = await createUserAndToken('intruder', 'intruder@example.com');

  const createResponse = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Owner only task', priority: 'medium' });

  const taskId = createResponse.body.task.id;

  const updateByIntruder = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${intruderToken}`)
    .send({ status: 'completed' });

  assert.equal(updateByIntruder.status, 404);

  const deleteByIntruder = await request(app)
    .delete(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${intruderToken}`);

  assert.equal(deleteByIntruder.status, 404);

  const ownerList = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.equal(ownerList.status, 200);
  assert.equal(ownerList.body.tasks.length, 1);
  assert.equal(ownerList.body.tasks[0].title, 'Owner only task');
});
