import packageJson from '../package.json';

const { npm_package_name, npm_package_version } = process.env;

const userAgent =
  npm_package_name && npm_package_version
    ? `${npm_package_name}/${npm_package_version}`
    : `${packageJson.name}/${packageJson.version}`;

function hasHeader(headers, name) {
  return Object.keys(headers).some(header => header.toLowerCase() === name);
}

function handleResponse(res) {
  function checkContentLength() {
    const contentLength = res.headers.get('content-length');
    return !(contentLength !== null && Number(contentLength) === 0);
  }
  if (!checkContentLength()) {
    return false;
  }
  function checkContentType() {
    const contentType = res.headers.get('content-type');
    if (/^application\/([\w.]+\+)?json(;.*)?/.test(contentType)) {
      return res.json();
    }
    if (
      !contentType ||
      /^application\/([\w.]+\+)?xml(;.*)?/.test(contentType) ||
      /^text\/|charset=utf-8$/.test(contentType)
    ) {
      return res.text();
    }
    return res.arrayBuffer();
  }

  return checkContentType();
}

function handleHeaders(fetchOpts, headers) {
  if (fetchOpts.headers) {
    Object.assign(fetchOpts.headers, headers);
  } else {
    fetchOpts.headers = headers;
  }
  if (!hasHeader(fetchOpts.headers, 'user-agent')) {
    fetchOpts.headers['User-Agent'] = userAgent;
  }
}

function handlePayload(fetchOpts, data) {
  if (data instanceof Buffer) {
    fetchOpts.body = data;
    return;
  }
  const dataType = typeof data;
  if (dataType !== 'string') {
    data = JSON.stringify(data);
  }
  if (!hasHeader(fetchOpts.headers, 'content-type')) {
    fetchOpts.headers['Content-Type'] = 'application/json;charset=utf-8';
  }
  fetchOpts.body = data;
}

async function execute(method, path, data, reqHeaders = {}, fetchOpts = {}, returnAlsoHeaders = false) {
  fetchOpts.method = method;

  handleHeaders(fetchOpts, reqHeaders);

  data && handlePayload(fetchOpts, data);

  const res = await globalThis.fetch(path, fetchOpts);

  if (res.status >= 400) {
    const error = new Error(res.statusText);
    error.http_status = res.status;
    error.http_code = res.status;
    error.http_response = res;
    throw error;
  }
  const { headers } = res;
  if (method === 'HEAD') {
    return { headers };
  }
  async function getBody() {
    if (res.status === 204) {
      return false;
    }
    return handleResponse(res);
  }

  const body = await getBody();

  function handleReturn() {
    if (returnAlsoHeaders) {
      return { status: res.status, headers, body };
    }
    return body;
  }
  return handleReturn();
}

export async function http_head(path, headers, fetchOpts) {
  return execute('HEAD', path, undefined, headers, fetchOpts);
}

export async function http_options(path, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('OPTIONS', path, undefined, headers, fetchOpts, returnAlsoHeaders);
}

export async function http_get(path, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('GET', path, undefined, headers, fetchOpts, returnAlsoHeaders);
}

export async function http_del(path, data, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('DELETE', path, data, headers, fetchOpts, returnAlsoHeaders);
}

export async function http_put(path, data, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('PUT', path, data, headers, fetchOpts, returnAlsoHeaders);
}

export async function http_post(path, data, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('POST', path, data, headers, fetchOpts, returnAlsoHeaders);
}

export async function http_patch(path, data, headers, fetchOpts, returnAlsoHeaders) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute('PATCH', path, data, headers, fetchOpts, returnAlsoHeaders);
}
