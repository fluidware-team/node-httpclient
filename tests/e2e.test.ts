import type { Request, Response } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { http_get, http_head, http_options, http_post, http_put, http_patch, http_del, setFWHTTPConfig } from '../src';
import * as express from 'express';
import * as path from 'path';
import { resetFWHTTPConfig } from '../src/config';

const app = express();

const get_test = { get: true };

const option_test = { options: true };

const post_test = { post: true };

const put_test = { put: true };

const patch_test = { patch: true };

const del_test = { del: true };

const headerKey = 'x-test-header';
const headerValue = 'fluidware srl';

app.get('/', (req: Request, res: Response) => {
  res.set(headerKey, headerValue).json(get_test);
});

app.head('/', (req: Request, res: Response) => {
  res.set(headerKey, headerValue).status(200).send();
});

app.get('/headers', (req: Request, res: Response) => {
  const header = req.get(headerKey);
  if (!header || header !== headerValue) {
    res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
    return;
  }
  res.set(headerKey, headerValue).json(get_test);
});

app.get('/redirect', (req: Request, res: Response) => {
  res.redirect('/');
});

app.get('/jpg', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'unnamed.jpg'));
});

app.options('/', (req: Request, res: Response) => {
  res.set(headerKey, headerValue).json(option_test);
});

app.options('/headers', (req: Request, res: Response) => {
  const header = req.get(headerKey);
  if (!header || header !== headerValue) {
    res.status(400).json({ status: 400, reason: 'missing required header x-test-header' });
    return;
  }
  res.set(headerKey, headerValue).json(option_test);
});

app.options('/redirect', (req: Request, res: Response) => {
  res.redirect('/');
});

app.post('/', express.text(), (req: Request, res: Response) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post', express.json(), (req: Request, res: Response) => {
  try {
    expect(req.body).toEqual({ test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.post('/post-empty', express.text(), express.json(), (req: Request, res: Response) => {
  if (Number(req.get('content-length') || 0) > 0) {
    res.status(400).json({ status: 400, reason: 'content-length greater than 0' });
    return;
  }
  // express.json() put {} event if no body is present..
  try {
    expect(req.body).toEqual({});
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'body is present' });
    return;
  }
  res.set(headerKey, headerValue).json(post_test);
});

app.put('/', express.text(), (req: Request, res: Response) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.put('/put', express.json(), (req: Request, res: Response) => {
  try {
    expect(req.body).toEqual({ test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(put_test);
});

app.patch('/', express.text(), (req: Request, res: Response) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.patch('/patch', express.json(), (req: Request, res: Response) => {
  try {
    expect(req.body).toEqual({ test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(patch_test);
});

app.delete('/', express.text(), (req: Request, res: Response) => {
  if (req.body !== 'test') {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(del_test);
});

app.delete('/delete', express.json(), (req: Request, res: Response) => {
  try {
    expect(req.body).toEqual({ test: true });
  } catch (e) {
    res.status(400).json({ status: 400, reason: 'missing required body' });
    return;
  }
  res.set(headerKey, headerValue).json(del_test);
});

app.get('/user-agent', (req: Request, res: Response) => {
  res.json({ 'user-agent': req.get('user-agent') });
});

describe('e2e', function () {
  let port: number;
  let server: Server;
  let url: string;
  beforeAll(done => {
    server = app.listen(0, '127.0.0.1', () => {
      port = (server.address() as AddressInfo).port;
      url = `http://127.0.0.1:${port}`;
      done();
    });
  });
  afterAll(done => {
    server.closeAllConnections();
    server.close(() => {
      done();
    });
  });
  describe('http_get', function () {
    it('must return json body', async () => {
      const ret = await http_get(`${url}/`);
      expect(ret).toEqual(get_test);
    });
    it('must return json body following redirect', async () => {
      const ret = await http_get(`${url}/redirect`);
      expect(ret).toEqual(get_test);
    });
    it('must return nothing not following redirect', async () => {
      const ret = await http_get(`${url}/redirect`, undefined, { redirect: 'manual' });
      expect(ret).toEqual('Found. Redirecting to /');
    });
    it('must return json body sending custom header', async () => {
      const ret = await http_get(`${url}/headers`, { [headerKey]: headerValue });
      expect(ret).toEqual(get_test);
    });
    it('must return an object with body and response headers ', async () => {
      const { body, headers } = await http_get(`${url}/`, true);
      expect(body).toEqual(get_test);
      expect(headers.get(headerKey)).toBe(headerValue);
    });
    it('must return an object with body and response headers v2', async () => {
      const { body, headers } = await http_get(`${url}/`, undefined, true);
      expect(body).toEqual(get_test);
      expect(headers.get(headerKey)).toBe(headerValue);
    });
    it('must return an arraybuffer', async () => {
      const ret = await http_get(`${url}/jpg`);
      expect(typeof ret).toBe('object');
    });
  });
  describe('http_head', function () {
    it('must return headers', async () => {
      const res = await http_head(`${url}/`);
      expect(res.headers.get(headerKey)).toBe(headerValue);
    });
    it('must return headers following redirect', async () => {
      const { headers } = await http_head(`${url}/redirect`);
      expect(headers.get('content-type')).toBe('application/json; charset=utf-8');
    });
    it('must return headers NOT following redirect', async () => {
      const { headers } = await http_head(`${url}/redirect`, undefined, { redirect: 'manual' });
      expect(headers.get('location')).toBe('/');
      expect(headers.get('content-type')).toBe('text/plain; charset=utf-8');
    });
  });
  describe('http_options', function () {
    it('must return json body', async () => {
      const ret = await http_options(`${url}/`);
      expect(ret).toEqual(option_test);
    });
    it('must return json body following redirect', async () => {
      const ret = await http_options(`${url}/redirect`);
      expect(ret).toEqual(option_test);
    });
    it('must return nothing not following redirect', async () => {
      const ret = await http_options(`${url}/redirect`, undefined, { redirect: 'manual' });
      expect(ret).toEqual('Found. Redirecting to /');
    });
    it('must return json body sending custom header', async () => {
      const ret = await http_options(`${url}/headers`, { [headerKey]: headerValue });
      expect(ret).toEqual(option_test);
    });
    it('must return an object with body and response headers ', async () => {
      const { body, headers } = await http_options(`${url}/`, true);
      expect(body).toEqual(option_test);
      expect(headers.get(headerKey)).toBe(headerValue);
    });
    it('must return an object with body and response headers v2', async () => {
      const { body, headers } = await http_options(`${url}/`, undefined, true);
      expect(body).toEqual(option_test);
      expect(headers.get(headerKey)).toBe(headerValue);
    });
  });
  describe('http_post', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      expect(ret).toEqual(post_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_post(`${url}/post`, { test: true }, true);
      expect(body).toEqual(post_test);
    });
    it('must return json body', async () => {
      const { body } = await http_post(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      expect(body).toEqual(post_test);
    });
    it('must return json body - no payload', async () => {
      const body = await http_post(`${url}/post-empty`);
      expect(body).toEqual(post_test);
    });
    it('must return json body', async () => {
      const { body } = await http_post(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      expect(body).toEqual(post_test);
    });
  });
  describe('http_put', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_put(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      expect(ret).toEqual(put_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_put(`${url}/put`, { test: true }, true);
      expect(body).toEqual(put_test);
    });
    it('must return json body', async () => {
      const { body } = await http_put(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      expect(body).toEqual(put_test);
    });
    it('must return json body', async () => {
      const { body } = await http_put(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      expect(body).toEqual(put_test);
    });
  });
  describe('http_patch', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_patch(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      expect(ret).toEqual(patch_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_patch(`${url}/patch`, { test: true }, true);
      expect(body).toEqual(patch_test);
    });
    it('must return json body', async () => {
      const { body } = await http_patch(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        true
      );
      expect(body).toEqual(patch_test);
    });
    it('must return json body', async () => {
      const { body } = await http_patch(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      expect(body).toEqual(patch_test);
    });
  });
  describe('http_del', function () {
    it('must return json body posting Buffer', async () => {
      const ret = await http_del(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' });
      expect(ret).toEqual(del_test);
    });
    it('must return json body posting object', async () => {
      const { body } = await http_del(`${url}/delete`, { test: true }, true);
      expect(body).toEqual(del_test);
    });
    it('must return json body', async () => {
      const { body } = await http_del(`${url}/`, Buffer.from('test', 'utf-8'), { 'content-type': 'text/plain' }, true);
      expect(body).toEqual(del_test);
    });
    it('must return json body', async () => {
      const { body } = await http_del(
        `${url}/`,
        Buffer.from('test', 'utf-8'),
        { 'content-type': 'text/plain' },
        undefined,
        true
      );
      expect(body).toEqual(del_test);
    });
  });
  describe('user agent', () => {
    afterEach(() => {
      // reset user-agent to default
      resetFWHTTPConfig();
      setFWHTTPConfig({});
    });
    it('should return a default user-agent', async () => {
      const body = await http_get<{ 'user-agent': string }>(`${url}/user-agent`);
      const packageJson = require('../package.json');
      expect(body['user-agent']).toBe(`${packageJson.name}/${packageJson.version}`);
    });
    it('should return a custom user-agent', async () => {
      setFWHTTPConfig({
        agentName: 'test-agent',
        agentVersion: '1.0.0'
      });
      const body = await http_get<{ 'user-agent': string }>(`${url}/user-agent`);
      expect(body['user-agent']).toBe('test-agent/1.0.0');
    });
    it('should return a default user-agent (after reset)', async () => {
      const body = await http_get<{ 'user-agent': string }>(`${url}/user-agent`);
      const packageJson = require('../package.json');
      expect(body['user-agent']).toBe(`${packageJson.name}/${packageJson.version}`);
    });
    it('should return the user-agent set into the header', async () => {
      const body = await http_get<{ 'user-agent': string }>(`${url}/user-agent`, {
        'user-agent': 'manual-test-agent/9.8.7'
      });
      expect(body['user-agent']).toBe('manual-test-agent/9.8.7');
      const body2 = await http_get<{ 'user-agent': string }>(`${url}/user-agent`, {
        'User-Agent': 'manual-test-agent-2/8.7.6'
      });
      expect(body2['user-agent']).toBe('manual-test-agent-2/8.7.6');
    });
  });
});
