const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { randomUUID } = require('node:crypto');
const { createApp } = require('../dist/main');
const { CampusRepository } = require('../dist/events/campus.repository');
let app, baseUrl, categories;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function request(method, path, body, raw = false) {
  const response = await fetch(baseUrl + path, {
    method, headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000),
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : undefined, text, headers: response.headers };
}
function error(response, status, code) {
  assert.equal(response.status, status, JSON.stringify(response.body));
  assert.equal(response.body.statusCode, status);
  if (code) assert.equal(response.body.errorCode, code);
  assert.equal(typeof response.body.message, 'string');
  assert.match(response.body.traceId, uuid);
  assert.equal(response.headers.get('x-trace-id'), response.body.traceId);
}
async function create(title = 'Campus lecture') {
  const response = await request('POST', '/events', { title, categoryId: categories[0].id });
  assert.equal(response.status, 201);
  return response.body;
}
before(async () => {
  app = await createApp({ logger: false });
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
  categories = (await request('GET', '/categories')).body;
});
after(async () => { if (app) await app.close(); });

test('Seed categories and empty events are 200, not 404', async () => {
  assert.equal(categories.length, 3);
  assert.equal(new Set(categories.map((c) => c.id)).size, 3);
  categories.forEach((c) => { assert.match(c.id, uuid); assert.ok(c.name); });
  const response = await request('GET', '/events');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test('Event CRUD: Location, UUID, immutable fields, partial PATCH and empty 204', async () => {
  const created = await request('POST', '/events', {
    title: '  REST lecture  ', description: 'API basics', categoryId: categories[0].id,
  });
  assert.equal(created.status, 201);
  const event = created.body;
  assert.match(event.id, uuid);
  assert.equal(event.title, 'REST lecture');
  assert.equal(event.createdAt, event.updatedAt);
  assert.equal(new Date(event.createdAt).toISOString(), event.createdAt);
  const path = '/events/' + event.id;
  assert.equal(created.headers.get('location'), path);
  assert.deepEqual((await request('GET', path)).body, event);
  assert.ok((await request('GET', '/events')).body.some((item) => item.id === event.id));
  const updated = await request('PATCH', path, { title: 'Updated title' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, 'Updated title');
  assert.equal(updated.body.id, event.id);
  assert.equal(updated.body.createdAt, event.createdAt);
  assert.ok(updated.body.updatedAt > event.updatedAt);
  assert.equal(updated.body.description, event.description);
  assert.equal(updated.body.categoryId, event.categoryId);
  const changedCategory = await request('PATCH', path, { categoryId: categories[1].id, description: '' });
  assert.equal(changedCategory.body.categoryId, categories[1].id);
  assert.equal(changedCategory.body.description, '');
  assert.equal(changedCategory.body.title, 'Updated title');
  const removed = await request('DELETE', path);
  assert.equal(removed.status, 204);
  assert.equal(removed.text, '');
  assert.equal(removed.headers.get('content-type'), null);
  error(await request('GET', path), 404, 'EVENT_NOT_FOUND');
  error(await request('DELETE', path), 404, 'EVENT_NOT_FOUND');
});

test('Invalid create bodies, unknown categories and protected fields return 400', async () => {
  const valid = { title: 'Test', categoryId: categories[0].id };
  for (const body of [
    {}, { categoryId: categories[0].id }, { title: 'Test' },
    { ...valid, title: '' }, { ...valid, title: '  ' }, { ...valid, title: 12 },
    { ...valid, title: null }, { ...valid, title: 'a'.repeat(201) },
    { ...valid, categoryId: 'abc' }, { ...valid, categoryId: null },
    { ...valid, description: null }, { ...valid, description: 7 },
    { ...valid, description: 'x'.repeat(2001) },
    { ...valid, id: randomUUID() }, { ...valid, createdAt: '2020-01-01' },
    { ...valid, updatedAt: '2020-01-01' }, { ...valid, unknown: true },
  ]) error(await request('POST', '/events', body), 400, 'VALIDATION_ERROR');
  error(await request('POST', '/events', { ...valid, categoryId: randomUUID() }), 400, 'CATEGORY_NOT_FOUND');
  error(await request('POST', '/events', '{', true), 400, 'BAD_REQUEST');
  for (const title of ['A', 'x'.repeat(200)]) {
    const event = await create(title);
    assert.equal(event.description, '');
    await request('DELETE', '/events/' + event.id);
  }
});

test('Invalid PATCH cannot change persisted values or server fields', async () => {
  const event = await create();
  const path = '/events/' + event.id;
  for (const body of [
    { title: '' }, { title: null }, { title: 4 }, { title: 'x'.repeat(201) },
    { description: null }, { description: 4 }, { description: 'x'.repeat(2001) },
    { categoryId: null }, { categoryId: 'abc' }, { id: randomUUID() },
    { createdAt: event.createdAt }, { updatedAt: event.updatedAt }, { unknown: true },
  ]) error(await request('PATCH', path, body), 400, 'VALIDATION_ERROR');
  error(await request('PATCH', path, {}), 400, 'EMPTY_UPDATE');
  error(await request('PATCH', path, { title: 'Should not persist', categoryId: randomUUID() }), 400, 'CATEGORY_NOT_FOUND');
  assert.deepEqual((await request('GET', path)).body, event);
  await request('DELETE', path);
});

test('Missing events return 404; malformed path UUID returns 400', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const body = method === 'PATCH' ? { title: 'New title' } : undefined;
    error(await request(method, '/events/' + randomUUID(), body), 404, 'EVENT_NOT_FOUND');
    error(await request(method, '/events/abc', body), 400, 'BAD_REQUEST');
  }
});

test('Registration: Location resolves, duplicate 409, one stored record, other events allowed', async () => {
  const first = await create('First');
  const second = await create('Second');
  const participantId = randomUUID();
  const path = '/events/' + first.id + '/registrations';
  const response = await request('POST', path, { participantId });
  assert.equal(response.status, 201);
  assert.match(response.body.id, uuid);
  assert.equal(response.body.eventId, first.id);
  assert.equal(response.body.participantId, participantId);
  assert.ok(Number.isFinite(Date.parse(response.body.createdAt)));
  assert.equal(response.headers.get('location'), path + '/' + response.body.id);
  assert.deepEqual((await request('GET', response.headers.get('location'))).body, response.body);
  error(await request('POST', path, { participantId }), 409, 'REGISTRATION_EXISTS');
  error(await request('POST', path, { participantId: participantId.toUpperCase() }), 409, 'REGISTRATION_EXISTS');
  assert.equal((await request('GET', path)).body.length, 1);
  assert.equal(app.get(CampusRepository).findRegistrations(first.id).length, 1);
  assert.equal((await request('POST', '/events/' + second.id + '/registrations', { participantId })).status, 201);
  assert.equal((await request('POST', path, { participantId: randomUUID() })).status, 201);
  error(await request('GET', '/events/' + second.id + '/registrations/' + response.body.id), 404, 'REGISTRATION_NOT_FOUND');
  await request('DELETE', '/events/' + first.id);
  assert.equal(app.get(CampusRepository).findRegistrations(first.id).length, 0);
  assert.equal(app.get(CampusRepository).findRegistrations(second.id).length, 1);
  error(await request('GET', response.headers.get('location')), 404, 'EVENT_NOT_FOUND');
  await request('DELETE', '/events/' + second.id);
});

test('Registration validation precedes event lookup; valid request to missing event returns 404', async () => {
  const event = await create();
  for (const id of [event.id, randomUUID()]) {
    const path = '/events/' + id + '/registrations';
    for (const body of [{}, { participantId: null }, { participantId: 5 }, { participantId: 'abc' },
      { participantId: randomUUID(), eventId: event.id }, { participantId: randomUUID(), id: randomUUID() }]) {
      error(await request('POST', path, body), 400, 'VALIDATION_ERROR');
    }
  }
  error(await request('POST', '/events/' + randomUUID() + '/registrations', { participantId: randomUUID() }), 404, 'EVENT_NOT_FOUND');
  error(await request('POST', '/events/abc/registrations', { participantId: randomUUID() }), 400, 'BAD_REQUEST');
  await request('DELETE', '/events/' + event.id);
});

test('Concurrent duplicate registrations produce one 201 and remaining 409', async () => {
  const event = await create();
  const participantId = randomUUID();
  const responses = await Promise.all(Array.from({ length: 8 }, () =>
    request('POST', '/events/' + event.id + '/registrations', { participantId })));
  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.equal(responses.filter((r) => r.status === 409).length, 7);
  assert.equal(app.get(CampusRepository).findRegistrations(event.id).length, 1);
  await request('DELETE', '/events/' + event.id);
});

test('Uppercase event UUID resolves to the same event', async () => {
  const event = await create();
  assert.deepEqual((await request('GET', '/events/' + event.id.toUpperCase())).body, event);
  await request('DELETE', '/events/' + event.id);
});

test('Repository returns copies and a new application starts with empty data', () => {
  const repository = new CampusRepository();
  const event = { id: randomUUID(), title: 'Original', description: '', categoryId: categories[0].id, createdAt: 'now', updatedAt: 'now' };
  const saved = repository.saveEvent(event);
  event.title = 'Mutated input';
  saved.title = 'Mutated result';
  repository.findEvents()[0].title = 'Mutated list';
  assert.equal(repository.findEvent(event.id).title, 'Original');
  repository.findCategories()[0].name = 'Mutated category';
  assert.equal(repository.findCategories()[0].name, 'Лекції');
  assert.deepEqual(new CampusRepository().findEvents(), []);
  assert.deepEqual(new CampusRepository().findRegistrations(event.id), []);
});
