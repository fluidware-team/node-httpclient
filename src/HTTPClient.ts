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
import { Config } from './config';
import { FullResponse, HeadersResponse, Payload } from './types';

const userAgent = `${Config.agentName}/${Config.agentVersion}`;

function hasHeader(headers: HeadersInit, name: string) {
  return Object.keys(headers).some(header => header.toLowerCase() === name);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentLength = res.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) === 0) {
    return Promise.resolve(false as T);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && /application\/json/.test(contentType)) {
    return (await res.json()) as T;
  }
  if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
    return (await res.text()) as T;
  }
  return (await res.arrayBuffer()) as T;
}

function handleHeaders(fetchOpts: RequestInit, headers: HeadersInit) {
  if (fetchOpts.headers) {
    Object.assign(fetchOpts.headers, headers);
  } else {
    fetchOpts.headers = headers;
  }
  if (!hasHeader(fetchOpts.headers, 'user-agent')) {
    Object.assign(fetchOpts.headers, { 'user-agent': userAgent });
  }
}

function handlePayload(fetchOpts: RequestInit, data: Payload) {
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
  fetchOpts.body = data as BodyInit;
}

function execute(
  method: 'HEAD',
  path: RequestInfo,
  data: undefined,
  reqHeaders: HeadersInit,
  fetchOpts: RequestInit,
  returnAlsoHeaders: true
): Promise<HeadersResponse>;

function execute<T>(
  method: 'GET' | 'OPTIONS',
  path: RequestInfo,
  data: undefined,
  reqHeaders: HeadersInit,
  fetchOpts: RequestInit,
  returnAlsoHeaders: boolean
): Promise<T | FullResponse<T>>;

function execute<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: RequestInfo,
  data: Payload | undefined,
  reqHeaders: HeadersInit,
  fetchOpts: RequestInit,
  returnAlsoHeaders: boolean
): Promise<T | FullResponse<T>>;

async function execute<T>(
  method: string,
  path: RequestInfo,
  data: Payload | undefined,
  reqHeaders = {} as HeadersInit,
  fetchOpts = {} as RequestInit,
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
    return { headers };
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
      return { headers, body };
    }
    return body;
  }

  return handleReturn();
}

export async function http_head(path: RequestInfo, headers?: HeadersInit, fetchOpts?: RequestInit) {
  return execute('HEAD', path, undefined, headers || ({} as HeadersInit), fetchOpts || ({} as RequestInit), true);
}

export async function http_options<T>(path: RequestInfo, returnAlsoHeaders?: false): Promise<T>;
export async function http_options<T>(path: RequestInfo, returnAlsoHeaders?: true): Promise<FullResponse<T>>;
export async function http_options<T>(path: RequestInfo, returnAlsoHeaders?: boolean): Promise<FullResponse<T>>;
export async function http_options<T>(path: RequestInfo, headers?: HeadersInit, returnAlsoHeaders?: false): Promise<T>;
export async function http_options<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_options<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_options<T>(
  path: RequestInfo,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}
export async function http_get<T>(path: RequestInfo, returnAlsoHeaders?: false): Promise<T>;
export async function http_get<T>(path: RequestInfo, returnAlsoHeaders?: true): Promise<FullResponse<T>>;
export async function http_get<T>(path: RequestInfo, returnAlsoHeaders?: boolean): Promise<FullResponse<T>>;
export async function http_get<T>(path: RequestInfo, headers?: HeadersInit, returnAlsoHeaders?: false): Promise<T>;
export async function http_get<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_get<T>(
  path: RequestInfo,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_get<T>(
  path: RequestInfo,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_post<T>(path: RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_post<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_put<T>(path: RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_put<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_patch<T>(path: RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_patch<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}

export async function http_del<T>(path: RequestInfo, data?: Payload, returnAlsoHeaders?: false): Promise<T>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  returnAlsoHeaders?: boolean
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: false
): Promise<T>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit,
  fetchOpts?: RequestInit,
  returnAlsoHeaders?: true
): Promise<FullResponse<T>>;
export async function http_del<T>(
  path: RequestInfo,
  data?: Payload,
  headers?: HeadersInit | boolean,
  fetchOpts?: RequestInit | boolean,
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
    headers || ({} as HeadersInit),
    fetchOpts || ({} as RequestInit),
    !!returnAlsoHeaders
  );
}
