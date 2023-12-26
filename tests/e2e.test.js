const { http_get, http_head, http_options, http_post, http_put, http_patch, http_del } = require('../build/src');
const express = require( 'express');
const assert = require( 'assert');
const { describe, it, before, after } = require('mocha');
const path = require( 'path');

const app = express();

const get_test = { get: true };

const option_test = { options: true };

const post_test = { post: true };

const put_test = { put: true };

const patch_test = { patch: true };

const del_test = { del: true };

const headerKey = 'x-test-header';
const headerValue = 'fluidware srl';

app.get('/', (req, res) => {
  res.set(headerKey, headerValue).json(get_test);
});

app.head('/', (req, res) => {
  res.set(headerKey, headerValue).status(200).send();
});

app.get('/headers', (req, res) => {
  const header = req.get(headerKey);
  if (!header || header !== headerValue) {
    return res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
  }
  res.set(headerKey, headerValue).json(get_test);
});

app.get('/redirect', (req, res) => {
  res.redirect('/');
});

app.get('/jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'unnamed.jpg'));
});

app.options('/', (req, res) => {
  res.set(headerKey, headerValue).json(option_test);
});

app.options('/headers', (req, res) => {
  const header = req.get(headerKey);
  if (!header || header !== headerValue) {
    return res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
  }
  res.set(headerKey, headerValue).json(option_test);
});

app.options('/redirect', (req, res) => {
  res.redirect('/');
});

app.post('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post-empty', express.text(), express.json(), (req, res) => {
  if (req.get('content-length') > 0) {
    return res.status(400).json({ status: 400, reason: 'content-length greater than 0' });
  }
  // express.json() put {} event if no body is present..
  try {
    assert.deepStrictEqual(req.body, {});
  } catch (e) {
    return res.status(400).json({ status: 400, reason: 'body is present' });
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.put('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.put('/put', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.patch('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.patch('/patch', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.delete('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(del_test);
});

app.delete('/delete', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    return res.status(400).json({ status: 400, reason: 'missing required body' });
  }
  res.set(headerKey, headerValue).json(del_test);
});

describe('e2e', function () {
  let port;
  let server;
  let url;
  before(done => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      url = `http://127.0.0.1:${port}`;
      done();
    });
  });
  after(done => {
    server.closeAllConnections();
    server.close(() => {
      done();
    });
  });
  describe('http_get', function () {
    it('must return json body', async () => {
      const ret = await http_get(`${url}/`);
      assert.deepStrictEqual(ret, get_test);
    });
    it('must return json body following redirect', async () => {
      const ret = await http_get(`${url}/redirect`);
      assert.deepStrictEqual(ret, get_test);
    });
    it('must return nothing not following redirect', async () => {
      const ret = await http_get(`${url}/redirect`, undefined, { redirect: 'manual' });
      assert.deepStrictEqual(ret, 'Found. Redirecting to /');
    });
    it('must return json body sending custom header', async () => {
      const ret = await http_get(`${url}/headers`, { [headerKey]: headerValue });
      assert.deepStrictEqual(ret, get_test);
    });
    it('must return an object with body and response headers ', async () => {
      const { body, headers } = await http_get(`${url}/`, true);
      assert.deepStrictEqual(body, get_test);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return an object with body and response headers v2', async () => {
      const { body, headers } = await http_get(`${url}/`, undefined, true);
      assert.deepStrictEqual(body, get_test);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return an arraybuffer', async () => {
      const ret = await http_get(`${url}/jpg`);
      assert.deepStrictEqual(typeof ret, 'object');
    });
  });
  describe('http_head', function () {
    it('must return headers', async () => {
      const { body, headers } = await http_head(`${url}/`);
      assert.strictEqual(body, undefined);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return headers following redirect', async () => {
      const { body, headers } = await http_head(`${url}/redirect`);
      assert.strictEqual(body, undefined);
      assert.strictEqual(headers.get('content-type'), 'application/json; charset=utf-8');
    });
    it('must return headers NOT following redirect', async () => {
      const { body, headers } = await http_head(`${url}/redirect`, undefined, { redirect: 'manual' });
      assert.strictEqual(body, undefined);
      assert.strictEqual(headers.get('location'), '/');
      assert.strictEqual(headers.get('content-type'), 'text/plain; charset=utf-8');
    });
  });
  describe('http_options', function () {
    it('must return json body', async () => {
      const ret = await http_options(`${url}/`);
      assert.deepStrictEqual(ret, option_test);
    });
    it('must return json body following redirect', async () => {
      const ret = await http_options(`${url}/redirect`);
      assert.deepStrictEqual(ret, option_test);
    });
    it('must return nothing not following redirect', async () => {
      const ret = await http_options(`${url}/redirect`, undefined, { redirect: 'manual' });
      assert.deepStrictEqual(ret, 'Found. Redirecting to /');
    });
    it('must return json body sending custom header', async () => {
      const ret = await http_options(`${url}/headers`, { [headerKey]: headerValue });
      assert.deepStrictEqual(ret, option_test);
    });
    it('must return an object with body and response headers ', async () => {
      const { body, headers } = await http_options(`${url}/`, true);
      assert.deepStrictEqual(body, option_test);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return an object with body and response headers v2', async () => {
      const { body, headers } = await http_options(`${url}/`, undefined, true);
      assert.deepStrictEqual(body, option_test);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
  });
  describe('http_post', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      assert.deepStrictEqual(ret, post_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_post(`${url}/post`, { test: true }, true);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body', async () => {
      const { body } = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body - no payload', async () => {
      const body = await http_post(`${url}/post-empty`);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body', async () => {
      const { body } = await http_post(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      assert.deepStrictEqual(body, post_test);
    });
  });
  describe('http_put', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_put(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      assert.deepStrictEqual(ret, put_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_put(`${url}/put`, { test: true }, true);
      assert.deepStrictEqual(body, put_test);
    });
    it('must return json body', async () => {
      const { body } = await http_put(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      assert.deepStrictEqual(body, put_test);
    });
    it('must return json body', async () => {
      const { body } = await http_put(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      assert.deepStrictEqual(body, put_test);
    });
  });
  describe('http_patch', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_patch(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      assert.deepStrictEqual(ret, patch_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_patch(`${url}/patch`, { test: true }, true);
      assert.deepStrictEqual(body, patch_test);
    });
    it('must return json body', async () => {
      const { body } = await http_patch(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        true
      );
      assert.deepStrictEqual(body, patch_test);
    });
    it('must return json body', async () => {
      const { body } = await http_patch(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      assert.deepStrictEqual(body, patch_test);
    });
  });
  describe('http_del', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_del(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      assert.deepStrictEqual(ret, del_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_del(`${url}/delete`, { test: true }, true);
      assert.deepStrictEqual(body, del_test);
    });
    it('must return json body', async () => {
      const { body } = await http_del(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      assert.deepStrictEqual(body, del_test);
    });
    it('must return json body', async () => {
      const { body } = await http_del(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      assert.deepStrictEqual(body, del_test);
    });
  });
});
