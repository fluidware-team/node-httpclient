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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { HttpError } from './httpError';
import { Config } from './config';
var userAgent = "".concat(Config.agentName, "/").concat(Config.agentVersion);
function hasHeader(headers, name) {
    return Object.keys(headers).some(function (header) { return header.toLowerCase() === name; });
}
function handleResponse(res) {
    var contentLength = res.headers.get('content-length');
    if (contentLength !== null && Number(contentLength) === 0) {
        return false;
    }
    var contentType = res.headers.get('content-type');
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
    var dataType = typeof data;
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
function execute(method, path, data, reqHeaders, fetchOpts, returnAlsoHeaders) {
    if (reqHeaders === void 0) { reqHeaders = {}; }
    if (fetchOpts === void 0) { fetchOpts = {}; }
    if (returnAlsoHeaders === void 0) { returnAlsoHeaders = false; }
    return __awaiter(this, void 0, void 0, function () {
        function getBody() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (res.status === 204) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, handleResponse(res)];
                });
            });
        }
        function handleReturn() {
            if (returnAlsoHeaders) {
                return { headers: headers, body: body };
            }
            return body;
        }
        var res, headers, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fetchOpts.method = method;
                    handleHeaders(fetchOpts, reqHeaders);
                    data && handlePayload(fetchOpts, data);
                    return [4 /*yield*/, globalThis.fetch(path, fetchOpts)];
                case 1:
                    res = _a.sent();
                    if (res.status >= 400) {
                        throw new HttpError(res.statusText, res.status, res);
                    }
                    headers = res.headers;
                    if (method === 'HEAD') {
                        return [2 /*return*/, { headers: headers }];
                    }
                    return [4 /*yield*/, getBody()];
                case 2:
                    body = _a.sent();
                    return [2 /*return*/, handleReturn()];
            }
        });
    });
}
export function http_head(path, headers, fetchOpts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute('HEAD', path, undefined, headers, fetchOpts)];
        });
    });
}
export function http_options(path, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('OPTIONS', path, undefined, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
export function http_get(path, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('GET', path, undefined, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
export function http_del(path, data, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('DELETE', path, data, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
export function http_put(path, data, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('PUT', path, data, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
export function http_post(path, data, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('POST', path, data, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
export function http_patch(path, data, headers, fetchOpts, returnAlsoHeaders) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof headers === 'boolean') {
                returnAlsoHeaders = headers;
                headers = undefined;
                fetchOpts = undefined;
            }
            else if (typeof fetchOpts === 'boolean') {
                returnAlsoHeaders = fetchOpts;
                fetchOpts = undefined;
            }
            return [2 /*return*/, execute('PATCH', path, data, headers, fetchOpts, returnAlsoHeaders)];
        });
    });
}
//# sourceMappingURL=index.js.map