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
function hasHeader(headers, name) {
    return Object.keys(headers).some(header => header.toLowerCase() === name);
}
function handleResponse(res) {
    const contentLength = res.headers.get('content-length');
    if (contentLength !== null && Number(contentLength) === 0) {
        return false;
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
function handleHeaders(fetchOpts, headers) {
    if (fetchOpts.headers) {
        Object.assign(fetchOpts.headers, headers);
    }
    else {
        fetchOpts.headers = headers;
    }
    if (!hasHeader(fetchOpts.headers, 'user-agent')) {
        Object.assign(fetchOpts.headers, { 'user-agent': userAgent });
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
async function execute(method, path, data, reqHeaders = {}, fetchOpts = {}, returnAlsoHeaders = false) {
    fetchOpts.method = method;
    handleHeaders(fetchOpts, reqHeaders);
    data && handlePayload(fetchOpts, data);
    const res = await globalThis.fetch(path, fetchOpts);
    if (res.status >= 400) {
        throw new HttpError(res.statusText, res.status, res);
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
            return { headers, body };
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
    }
    else if (typeof fetchOpts === 'boolean') {
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
    }
    else if (typeof fetchOpts === 'boolean') {
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
    }
    else if (typeof fetchOpts === 'boolean') {
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
    }
    else if (typeof fetchOpts === 'boolean') {
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
    }
    else if (typeof fetchOpts === 'boolean') {
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
    }
    else if (typeof fetchOpts === 'boolean') {
        returnAlsoHeaders = fetchOpts;
        fetchOpts = undefined;
    }
    return execute('PATCH', path, data, headers, fetchOpts, returnAlsoHeaders);
}
//# sourceMappingURL=index.js.map