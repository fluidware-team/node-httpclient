import assert from 'assert';
import { describe, it, beforeEach, afterEach, before, after } from 'mocha';

describe('http lib', function () {
  let _fetch;
  before(() => {
    _fetch = globalThis.fetch;
  });
  after(() => {
    globalThis.fetch = _fetch;
  });

  describe('http_get', function () {
    //
    it('Should call http_get an get res.text() from execute', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return '__test__';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      const result = await http_get('test');
      assert.strictEqual(result, '__test__', 'Result must be __test__');
    });

    it('Should call http_get an get res.json() from execute', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return '__test__';
          },
          json: function () {
            return { message: 'test' };
          },
          headers: {
            get: function () {
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      const result = await http_get('test');
      assert.strictEqual(result instanceof Object, true, 'Result must be an instance of Object');
    });

    it('Should call http_get an return false from execute', async function () {
      let textCalled = false;
      let jsonCalled = false;
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            textCalled = true;
          },
          json: function () {
            jsonCalled = true;
          },
          headers: {
            get: function (header) {
              if (header.toLowerCase() === 'content-length') {
                return 0;
              }
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      const result = await http_get('test');
      assert.strictEqual(result, false, 'Result must be false');
      assert.strictEqual(textCalled, false, 'textCalled must be false');
      assert.strictEqual(jsonCalled, false, 'jsonCalled must be false');
    });

    it('Should call http_get an get an error because status is > 400', async function () {
      const fetch = async function () {
        return {
          status: 400,
          statusText: 'Bad Request',
          text: function () {
            return 'Bad Request';
          },
          json: function () {
            return { message: 'test' };
          },
          headers: {
            get: function () {
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      let errored = false;
      try {
        await http_get('test');
      } catch (err) {
        errored = true;
      }

      assert.strictEqual(errored, true, 'errored must be TRUE');
    });

    it('Should call http_get honoring fetchOpts', async function () {
      const fetch = async function (url, opts) {
        assert.strictEqual(opts.method, 'GET');
        assert.strictEqual(opts.redirect, 'manual');
        assert.strictEqual(opts.headers['User-Agent'], 'test/1.2.3');
        return {
          status: 200,
          text: function () {
            return '__test__';
          },
          json: function () {
            return { message: 'test' };
          },
          headers: {
            get: function () {
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      const result = await http_get(
        'test',
        { 'User-Agent': 'test/1.2.3' },
        {
          redirect: 'manual'
        }
      );
      assert.strictEqual(result instanceof Object, true, 'Result must be an instance of Object');
    });

    it('Should call http_get honoring fetchOpts merging headers', async function () {
      const fetch = async function (url, opts) {
        assert.strictEqual(opts.method, 'GET');
        assert.strictEqual(opts.redirect, 'manual');
        assert.strictEqual(opts.headers['X-Custom-Header'], 'qwerty');
        assert.strictEqual(opts.headers['User-Agent'], 'test/3.2.1');
        return {
          status: 200,
          text: function () {
            return '__test__';
          },
          json: function () {
            return { message: 'test' };
          },
          headers: {
            get: function () {
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_get } = require('../src/');
      const result = await http_get(
        'test',
        {
          'X-Custom-Header': 'qwerty'
        },
        {
          redirect: 'manual',
          headers: { 'User-Agent': 'test/3.2.1' }
        }
      );
      assert.strictEqual(result instanceof Object, true, 'Result must be an instance of Object');
    });
  });
  describe('not from npm', function () {
    let processEnv;
    beforeEach(function (done) {
      processEnv = Object.assign({}, process.env);
      done();
    });
    afterEach(function (done) {
      process.env = processEnv;
      done();
    });
    it('should return packageJson user-agent', async function () {
      const fetch = async function (url, opts) {
        const { name, version } = require('../package.json');
        assert.strictEqual(opts.headers['User-Agent'], `${name}/${version}`);
        return {
          status: 200,
          text: function () {
            return '__test__';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      delete process.env.npm_package_name;
      delete process.env.npm_package_version;
      const { http_get } = require('../src/');
      const result = await http_get('test');
      assert.strictEqual(result, '__test__', 'Result must be __test__');
    });
  });
  describe('http_del', function () {
    it('Should call http_del and check result', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return 'delete';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_del } = require('../src/');
      const result = await http_del('test');
      assert.strictEqual(result, 'delete', 'Result must be delete');
    });

    it('Should call http_del and check result', async function () {
      let testCalled = false;
      const fetch = async function () {
        return {
          status: 204,
          text: function () {
            testCalled = true;
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_del } = require('../src/');
      const result = await http_del('test');
      assert.strictEqual(result, false, 'Result must be false');
      assert.strictEqual(testCalled, false);
    });
  });

  describe('http_put', function () {
    it('Should call http_put and check result', async function () {
      const fetch = async function (url, opts) {
        assert.strictEqual(opts.method, 'PUT');
        return {
          status: 200,
          text: function () {
            return 'put';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_put } = require('../src/');
      const result = await http_put('test');
      assert.strictEqual(result, 'put', 'Result must be put');
    });
  });

  describe('http_patch', function () {
    it('Should call http_patch and check result', async function () {
      const fetch = async function (url, opts) {
        assert.strictEqual(opts.method, 'PATCH');
        return {
          status: 200,
          text: function () {
            return 'patch';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_patch } = require('../src/');
      const result = await http_patch('test');
      assert.strictEqual(result, 'patch', 'Result must be put');
    });
  });

  describe('http_post', function () {
    it('Should call http_post and check result', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return 'post';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_post } = require('../src/');
      const result = await http_post('test');
      assert.strictEqual(result, 'post', 'Result must be post');
    });

    it('Should call http_post with an Object  ', async function () {
      const fetch = async function () {
        return {
          status: 200,
          json: function () {
            return { test: 'me' };
          },
          headers: {
            get: function () {
              return 'application/json';
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_post } = require('../src/');
      const result = await http_post('/whatever', { test: 'me' }, { 'Content-Type': 'application/json' });
      assert.strictEqual(result.test, 'me', 'Result must be me');
    });

    it('Should call http_post with a string and check result text is ME  ', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return 'me';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_post } = require('../src/');
      const result = await http_post('/whatever', 'me');
      assert.strictEqual(result, 'me', 'Result must be me');
    });

    it('Should call http_post with a string and check result text is ME  ', async function () {
      const fetch = async function () {
        return {
          status: 200,
          text: function () {
            return 'me';
          },
          headers: {
            get: function () {
              return null;
            }
          }
        };
      };
      delete require.cache[require.resolve('../src/')];
      globalThis.fetch = fetch;

      const { http_post } = require('../src/');
      const result = await http_post('/whatever', 'me', { 'user-agent': 'test-httplib' });
      assert.strictEqual(result, 'me', 'Result must be me');
    });
  });
});
