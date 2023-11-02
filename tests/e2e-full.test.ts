import { http_get, http_head, http_options, http_post, http_put, http_patch, http_del, FullResponse } from '../src';
import * as express from 'express';
import * as assert from 'assert';
import { describe, it, before, after } from 'mocha';
import * as path from 'path';
import * as http from 'http';
import * as net from 'net';

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
    res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
    return;
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
    res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
    return;
  }
  res.set(headerKey, headerValue).json(option_test);
});

app.options('/redirect', (req, res) => {
  res.redirect('/');
});

app.post('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post-empty', express.text(), express.json(), (req: express.Request, res: express.Response) => {
  if (Number(req.get('content-length')) > 0) {
    res.status(400).json({ status: 400, reason: 'content-length greater than 0' });
    return;
  }
  // express.json() put {} event if no body is present...
  try {
    assert.deepStrictEqual(req.body, {});
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'body is present' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.put('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.put('/put', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.patch('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.patch('/patch', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.delete('/', express.text(), (req, res) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(del_test);
});

app.delete('/delete', express.json(), (req, res) => {
  try {
    assert.deepStrictEqual(req.body, { test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(del_test);
});

describe('e2e', function () {
  let port: number;
  let server: http.Server;
  let url: string;
  before(done => {
    server = app.listen(0, '127.0.0.1', () => {
      if (!server) {
        done(new Error('server is null'));
        return;
      }
      const addr = server.address() as net.AddressInfo;
      port = addr.port;
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
      const init: RequestInit = { redirect: 'manual' };
      const ret = await http_get(`${url}/redirect`, undefined, init);
      assert.deepStrictEqual(ret, 'Found. Redirecting to /');
    });
    it('must return json body sending custom header', async () => {
      const headers: HeadersInit = new Headers();
      headers.set(headerKey, headerValue);
      const ret = await http_get(`${url}/headers`, headers);
      assert.deepStrictEqual(ret, get_test);
    });
    it('must return an object with body and response headers ', async () => {
      const { body, headers } = (await http_get<object>(`${url}/`, true)) as FullResponse<object>;
      assert.deepStrictEqual(body, get_test);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return an object with body and response headers v2', async () => {
      const { body, headers } = (await http_get(`${url}/`, undefined, true)) as FullResponse<object>;
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
      const { headers } = await http_head(`${url}/`);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
    it('must return headers following redirect', async () => {
      const { headers } = await http_head(`${url}/redirect`);
      assert.strictEqual(headers.get('content-type'), 'application/json; charset=utf-8');
    });
    it('must return headers NOT following redirect', async () => {
      const { headers } = await http_head(`${url}/redirect`, undefined, { redirect: 'manual' });
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
      assert.deepStrictEqual(ret.headers.get('location'), '/where');
    });
    it('must return an object with body and response headers v2', async () => {
      const { headers } = await http_options(`${url}/`, undefined, true);
      assert.strictEqual(headers.get(headerKey), headerValue);
    });
  });
  describe('http_post', function () {
    it('must return json body posting Buffer', async () => {
      const headers: HeadersInit = new Headers();
      headers.set('content-type', 'text/plain');
      const ret = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), headers);
      assert.deepStrictEqual(ret, post_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_post(`${url}/post`, { test: true }, true);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body', async () => {
      const headers: HeadersInit = new Headers();
      headers.set('content-type', 'text/plain');
      const { body } = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), headers, true);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body - no payload', async () => {
      const body = await http_post(`${url}/post-empty`);
      assert.deepStrictEqual(body, post_test);
    });
    it('must return json body', async () => {
      const headers: HeadersInit = new Headers();
      headers.set('content-type', 'text/plain');
      const { body } = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), headers, undefined, true);
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
