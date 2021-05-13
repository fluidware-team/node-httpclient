import fetch from 'node-fetch';
import packageJson from '../package.json';

const { npm_package_name, npm_package_version } = process.env;

const userAgent =
  npm_package_name && npm_package_version
    ? `${npm_package_name}/${npm_package_version}`
    : `${packageJson.name}/${packageJson.version}`;

const hasHeader = function (headers, name) {
  return Object.keys(headers).filter(header => header.toLowerCase() === name).length > 0;
};

const handleResponse = function (res) {
  const contentLength = res.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) === 0) {
    return false;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.toLowerCase().indexOf('application/json') >= 0) {
    return res.json();
  }
  return res.text();
};

const handleHeaders = function (fetchOpts, headers) {
  if (fetchOpts.headers) {
    Object.assign(fetchOpts.headers, headers);
  } else {
    fetchOpts.headers = headers;
  }
  if (!hasHeader(fetchOpts.headers, 'user-agent')) {
    fetchOpts.headers['User-Agent'] = userAgent;
  }
};

const handlePayload = function (fetchOpts, data) {
  const dataType = typeof data;
  if (dataType !== 'undefined') {
    if (dataType !== 'string') {
      data = JSON.stringify(data);
    }
    if (!hasHeader(fetchOpts.headers, 'content-type')) {
      fetchOpts.headers['Content-Type'] = 'application/json;charset=utf-8';
    }
    fetchOpts.body = data;
  }
};

const execute = function (method, path, data, headers = {}, fetchOpts = {}) {
  fetchOpts.method = method;

  handleHeaders(fetchOpts, headers);

  handlePayload(fetchOpts, data);

  return fetch(path, fetchOpts).then(res => {
    if (res.status >= 400) {
      const error = new Error(res.statusText);
      error.http_code = res.status;
      error.http_response = res;
      throw error;
    }
    if (res.status === 204) {
      return false;
    }
    return handleResponse(res);
  });
};

export const http_get = (path, headers, fetchOpts) => {
  return execute('GET', path, undefined, headers, fetchOpts);
};

export const http_del = (path, data, headers, fetchOpts) => {
  return execute('DELETE', path, data, headers, fetchOpts);
};

export const http_put = (path, data, headers, fetchOpts) => {
  return execute('PUT', path, data, headers, fetchOpts);
};

export const http_post = (path, data, headers, fetchOpts) => {
  return execute('POST', path, data, headers, fetchOpts);
};

export const http_patch = (path, data, headers, fetchOpts) => {
  return execute('PATCH', path, data, headers, fetchOpts);
};
