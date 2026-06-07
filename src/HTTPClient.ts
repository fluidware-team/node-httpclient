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

import { HTTPClientError } from './HTTPClientError';
import { getUserAgent } from './config';
import { FullResponse, HeadersResponse, Payload } from './types';

function hasHeader(headers: globalThis.HeadersInit, name: string) {
  return Object.keys(headers).some(header => header.toLowerCase() === name);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentLength = res.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) === 0) {
    return Promise.resolve(false as T);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && /^application\/([\w.]+\+)?json(;.*)?/.test(contentType)) {
    return (await res.json()) as T;
  }
  if (
    !contentType ||
    /^application\/([\w.]+\+)?xml(;.*)?/.test(contentType) ||
    /^text\/|charset=utf-8$/.test(contentType)
  ) {
    return (await res.text()) as T;
  }
  return (await res.arrayBuffer()) as T;
}

function handleHeaders(fetchOpts: globalThis.RequestInit, headers: globalThis.HeadersInit) {
  if (fetchOpts.headers) {
    Object.assign(fetchOpts.headers, headers);
  } else {
    fetchOpts.headers = headers;
  }
  if (!hasHeader(fetchOpts.headers, 'user-agent')) {
    Object.assign(fetchOpts.headers, { 'user-agent': getUserAgent() });
  }
}

function handlePayload(fetchOpts: globalThis.RequestInit, data: Payload) {
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
  fetchOpts.body = data as globalThis.BodyInit;
}

function execute(
  method: 'HEAD',
  path: globalThis.RequestInfo,
  data: undefined,
  reqHeaders: globalThis.HeadersInit,
  fetchOpts: globalThis.RequestInit,
  returnAlsoHeaders: true
): Promise<HeadersResponse>;

function execute<T>(
  method: 'GET' | 'OPTIONS',
  path: globalThis.RequestInfo,
  data: undefined,
  reqHeaders: globalThis.HeadersInit,
  fetchOpts: globalThis.RequestInit,
  returnAlsoHeaders: boolean
): Promise<T | FullResponse<T>>;

function execute<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: globalThis.RequestInfo,
  data: Payload | undefined,
  reqHeaders: globalThis.HeadersInit,
  fetchOpts: globalThis.RequestInit,
  returnAlsoHeaders: boolean
): Promise<T | FullResponse<T>>;

async function execute<T>(
  method: string,
  path: globalThis.RequestInfo,
  data: Payload | undefined,
  reqHeaders = {} as globalThis.HeadersInit,
  fetchOpts = {} as globalThis.RequestInit,
  returnAlsoHeaders: boolean
): Promise<HeadersResponse | FullResponse<T> | T> {
  fetchOpts.method = method;

  handleHeaders(fetchOpts, reqHeaders);

  data && handlePayload(fetchOpts, data);

  const res = await globalThis.fetch(path, fetchOpts);

  if (res.status >= 400) {
    throw new HTTPClientError(res.statusText, res.status, res);
  }
  const { headers } = res;
  if (method === 'HEAD') {
    return { headers, status: res.status };
  }

  async function getBody<TBody>(): Promise<TBody> {
    if (res.status === 204) {
      return false as TBody;
    }
    return handleResponse<TBody>(res);
  }

  const body = await getBody<T>();

  function handleReturn(): T | FullResponse<T> {
    if (returnAlsoHeaders) {
      return { headers, body, status: res.status };
    }
    return body;
  }

  return handleReturn();
}

export async function http_head(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit
) {
  return execute(
    'HEAD',
    path,
    undefined,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    true
  );
}

export async function http_options<T>(path: globalThis.RequestInfo, returnAlsoHeaders?: false): Promise<T>;
export async function http_options<T>(path: globalThis.RequestInfo, returnAlsoHeaders?: true): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'OPTIONS',
    path,
    undefined,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}
export async function http_get<T>(path: globalThis.RequestInfo, returnAlsoHeaders?: false): Promise<T>;
export async function http_get<T>(path: globalThis.RequestInfo, returnAlsoHeaders?: true): Promise<FullResponse<T>>;
export async function http_get<T>(path: globalThis.RequestInfo, returnAlsoHeaders?: boolean): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: globalThis.RequestInfo,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'GET',
    path,
    undefined,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_post<T>(path: globalThis.RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'POST',
    path,
    data,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_put<T>(path: globalThis.RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'PUT',
    path,
    data,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'PATCH',
    path,
    data,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_del<T>(path: globalThis.RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit,
  fetchOpts?: globalThis.RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: globalThis.RequestInfo,
  data?: Payload,
  headers?: globalThis.HeadersInit | boolean,
  fetchOpts?: globalThis.RequestInit | boolean,
  returnAlsoHeaders?: boolean
) {
  if (typeof headers === 'boolean') {
    returnAlsoHeaders = headers;
    headers = undefined;
  }
  if (typeof fetchOpts === 'boolean') {
    returnAlsoHeaders = fetchOpts;
    fetchOpts = undefined;
  }
  return execute<T>(
    'DELETE',
    path,
    data,
    headers || ({} as globalThis.HeadersInit),
    fetchOpts || ({} as globalThis.RequestInit),
    !!returnAlsoHeaders
  );
}
