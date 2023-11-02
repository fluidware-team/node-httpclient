/*
 * Copyright Fluidware srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HttpError } from './httpError';
import { Config } from './config';

const userAgent = `${Config.agentName}/${Config.agentVersion}`;

export type HeadersResponse = {
  headers: Headers;
};

export type BodyResponse<T> = boolean | string | ArrayBuffer | T;

export type FullResponse<T> = {
  headers: Headers;
  body: BodyResponse<T>;
};

function hasHeader(headers: HeadersInit, name: string) {
  return Object.keys(headers).some(header => header.toLowerCase() === name);
}

function handleResponse<T>(res: Response): Promise<BodyResponse<T>> {
  const contentLength = res.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) === 0) {
    return Promise.resolve(false);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && /application\/json/.test(contentType)) {
    return res.json();
  }
  if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
    return res.text();
  }
  return res.arrayBuffer();
}

function handleHeaders(fetchOpts: RequestInit, headers: Headers) {
  if (fetchOpts.headers) {
    Object.assign(fetchOpts.headers, headers);
  } else {
    fetchOpts.headers = headers;
  }
  if (!hasHeader(fetchOpts.headers, 'user-agent')) {
    Object.assign(fetchOpts.headers, { 'user-agent': userAgent });
  }
}

function handlePayload(fetchOpts: RequestInit, data: BodyInit) {
  if (data instanceof Buffer) {
    fetchOpts.body = data;
    return;
  }
  const dataType = typeof data;
  if (dataType !== 'string') {
    data = JSON.stringify(data);
  }
  if (!fetchOpts.headers) {
    fetchOpts.headers = {};
  }
  if (!hasHeader(fetchOpts.headers, 'content-type')) {
    Object.assign(fetchOpts.headers, {
      'content-type': 'application/json;charset=utf-8'
    });
  }
  fetchOpts.body = data;
}

async function execute<T>(
  method: string,
  path: RequestInfo,
  data: BodyInit | undefined,
  reqHeaders = {} as Headers,
  fetchOpts = {} as RequestInit,
  returnAlsoHeaders = false
): Promise<HeadersResponse | FullResponse<T> | BodyResponse<T>> {
  fetchOpts.method = method;

  handleHeaders(fetchOpts, reqHeaders);

  data && handlePayload(fetchOpts, data);

  const res = await globalThis.fetch(path, fetchOpts);

  if (res.status >= 400) {
    throw new HttpError(res.statusText, res.status, res);
  }
  const { headers } = res;
  if (method === 'HEAD' || method === 'OPTIONS') {
    return { headers };
  }

  async function getBody<BodyT>(): Promise<BodyResponse<BodyT>> {
    if (res.status === 204) {
      return false;
    }
    return handleResponse<BodyT>(res);
  }

  const body = await getBody<T>();

  function handleReturn(): BodyResponse<T> | FullResponse<T> {
    if (returnAlsoHeaders) {
      return { headers, body };
    }
    return body;
  }
  return handleReturn();
}

export async function http_head(
  path: RequestInfo,
  headers?: Headers,
  fetchOpts?: RequestInit
): Promise<HeadersResponse> {
  return execute('HEAD', path, undefined, headers, fetchOpts) as Promise<HeadersResponse>;
}

export async function http_options(
  path: RequestInfo,
  headers?: Headers,
  fetchOpts?: RequestInit
): Promise<HeadersResponse> {
  return execute('OPTIONS', path, undefined, headers, fetchOpts, true) as Promise<HeadersResponse>;
}

export async function http_get<T>(path: RequestInfo): Promise<BodyResponse<T>>;

export async function http_get<T>(
  path: RequestInfo,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T> | BodyResponse<T>>;

export async function http_get<T>(
  path: RequestInfo,
  headers?: Headers,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T> | BodyResponse<T>>;

export async function http_get<T>(
  path: RequestInfo,
  headers?: Headers,
  fetchOpts?: RequestInit
): Promise<FullResponse<T> | BodyResponse<T>>;

export async function http_get<T>(
  path: RequestInfo,
  headers?: Headers | boolean,
  fetchOpts?: RequestInit | boolean,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T> | BodyResponse<T>> {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
    fetchOpts = undefined;
  } else if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>('GET', path, undefined, headers, fetchOpts, returnAlsoHeaders) as FullResponse<T> | BodyResponse<T>;
}

export async function http_del<T>(path: RequestInfo, data?: BodyInit): Promise<BodyResponse<T>>;

export async function http_del<T>(
  path: RequestInfo,
  data?: BodyInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T> | BodyResponse<T>>;

export async function http_del<T>(
  path: RequestInfo,
  data?: BodyInit,
  headers?: Headers,
  fetchOpts?: RequestInit | boolean
): Promise<FullResponse<T> | BodyResponse<T>>;

export async function http_del(
  path: RequestInfo,
  data: BodyInit,
  headers?: Headers,
  returnAlsoHeaders?: boolean
): Promise<unknown>;

export async function http_del<T>(
  path: RequestInfo,
  data?: BodyInit,
  headers?: Headers | boolean,
  fetchOpts?: RequestInit | boolean,
  returnAlsoHeaders?: boolean
): Promise<HeadersResponse | FullResponse<T> | BodyResponse<T>> {
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

export async function http_put(path: RequestInfo, data: BodyInit): Promise<unknown>;

export async function http_put(path: RequestInfo, data: BodyInit, returnAlsoHeaders?: boolean): Promise<unknown>;

export async function http_put(
  path: RequestInfo,
  data: BodyInit,
  headers?: Headers,
  returnAlsoHeaders?: boolean
): Promise<unknown>;

export async function http_put(
  path: RequestInfo,
  data: BodyInit,
  headers?: Headers | boolean,
  fetchOpts?: RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
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

export async function http_post(path: RequestInfo): Promise<unknown>;

export async function http_post(path: RequestInfo, data?: BodyInit | object): Promise<unknown>;

export async function http_post(
  path: RequestInfo,
  data?: BodyInit | object,
  returnAlsoHeaders?: boolean
): Promise<unknown>;

export async function http_post(
  path: RequestInfo,
  data?: BodyInit | object,
  headers?: Headers,
  returnAlsoHeaders?: boolean
): Promise<unknown>;

export async function http_post(
  path: RequestInfo,
  data?: BodyInit | { [k: string]: any },
  headers?: Headers | boolean,
  fetchOpts?: RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
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

export async function http_patch(path: RequestInfo, data: BodyInit): Promise<unknown>;

export async function http_patch(path: RequestInfo, data: BodyInit, returnAlsoHeaders?: boolean): Promise<unknown>;

export async function http_patch(
  path: RequestInfo,
  data: BodyInit,
  headers?: Headers,
  returnAlsoHeaders?: boolean
): Promise<unknown>;

export async function http_patch(
  path: RequestInfo,
  data: BodyInit,
  headers?: Headers | boolean,
  fetchOpts?: RequestInit | boolean,
  returnAlsoHeaders?: boolean
): Promise<unknown> {
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
