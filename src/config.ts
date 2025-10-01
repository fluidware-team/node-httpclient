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

import { _globalThis } from './globalThis';
import { NAME, VERSION } from './version';

interface FWHTTPConfig {
  agentName: string;
  agentVersion: string;
}

export const Config = {
  // eslint-disable-next-line n/no-process-env
  agentName: process.env.npm_package_name || NAME,
  // eslint-disable-next-line n/no-process-env
  agentVersion: process.env.npm_package_version || VERSION
};

const GLOBAL_FW_HTTPCLIENT_KEY = Symbol.for('fw.httpclient');

type FWGlobal = {
  [GLOBAL_FW_HTTPCLIENT_KEY]: FWHTTPConfig | undefined;
};

const _global = _globalThis as unknown as FWGlobal;

export function resetFWHTTPConfig() {
  if (_global[GLOBAL_FW_HTTPCLIENT_KEY]) {
    delete _global[GLOBAL_FW_HTTPCLIENT_KEY];
  }
}

export function setFWHTTPConfig(config: Partial<FWHTTPConfig>) {
  if (!_global[GLOBAL_FW_HTTPCLIENT_KEY]) {
    _global[GLOBAL_FW_HTTPCLIENT_KEY] = {
      agentName: Config.agentName,
      agentVersion: Config.agentVersion
    };
  }
  if (config.agentName) {
    _global[GLOBAL_FW_HTTPCLIENT_KEY].agentName = config.agentName;
  } else {
    _global[GLOBAL_FW_HTTPCLIENT_KEY].agentName = Config.agentName;
  }
  if (config.agentVersion) {
    _global[GLOBAL_FW_HTTPCLIENT_KEY].agentVersion = config.agentVersion;
  } else {
    _global[GLOBAL_FW_HTTPCLIENT_KEY].agentVersion = Config.agentVersion;
  }
}

export function getFWHTTPConfig(): FWHTTPConfig {
  if (!_global[GLOBAL_FW_HTTPCLIENT_KEY]) {
    _global[GLOBAL_FW_HTTPCLIENT_KEY] = {
      agentName: Config.agentName,
      agentVersion: Config.agentVersion
    };
  }
  return _global[GLOBAL_FW_HTTPCLIENT_KEY];
}

export function getUserAgent(): string {
  const config = getFWHTTPConfig();
  return `${config.agentName}/${config.agentVersion}`;
}
