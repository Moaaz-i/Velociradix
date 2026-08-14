/**
 * Type-Safe RPC & Proxy Client SDK for Velociradix
 * Inspired by Eden Treaty & tRPC.
 */

export function createClient(baseUrl = '', defaultOptions = {}) {
  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, '');
  const customFetch = defaultOptions.fetch || globalThis.fetch;

  if (typeof customFetch !== 'function') {
    throw new Error('Velociradix Client: No global fetch found. Please provide a custom fetch implementation in options.');
  }

  const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'del', 'patch', 'head', 'options'];

  function buildRequest(pathSegments, method, callOptions = {}) {
    const path = pathSegments.map((seg) => encodeURIComponent(String(seg))).join('/');
    let url = `${normalizedBaseUrl}/${path}`;

    // Query parameters
    if (callOptions.query && typeof callOptions.query === 'object') {
      const q = new URLSearchParams();
      for (const key in callOptions.query) {
        const val = callOptions.query[key];
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            val.forEach((item) => q.append(key, String(item)));
          } else {
            q.append(key, String(val));
          }
        }
      }
      const qs = q.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers = {
      ...(defaultOptions.headers || {}),
      ...(callOptions.headers || {}),
    };

    if (defaultOptions.token || callOptions.token) {
      const token = callOptions.token || defaultOptions.token;
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const httpMethod = method === 'del' ? 'DELETE' : method.toUpperCase();
    const fetchInit = {
      method: httpMethod,
      headers,
      ...defaultOptions.fetchOptions,
      ...callOptions.fetchOptions,
    };

    // Body handling
    if (callOptions.body !== undefined) {
      if (typeof callOptions.body === 'object' && callOptions.body !== null && !(callOptions.body instanceof FormData) && !(callOptions.body instanceof Blob) && !(callOptions.body instanceof ArrayBuffer) && !(callOptions.body instanceof Uint8Array)) {
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
        fetchInit.body = JSON.stringify(callOptions.body);
      } else {
        fetchInit.body = callOptions.body;
      }
    }

    // Timeout via AbortSignal
    const timeoutMs = callOptions.timeout || defaultOptions.timeout;
    let timer = null;
    if (timeoutMs && !fetchInit.signal && typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      fetchInit.signal = controller.signal;
      timer = setTimeout(() => controller.abort(), timeoutMs);
    }

    // Request hook
    if (typeof defaultOptions.onRequest === 'function') {
      defaultOptions.onRequest({ url, init: fetchInit });
    }
    if (typeof callOptions.onRequest === 'function') {
      callOptions.onRequest({ url, init: fetchInit });
    }

    return customFetch(url, fetchInit)
      .then(async (res) => {
        if (timer) clearTimeout(timer);

        const responseHeaders = {};
        if (res.headers && typeof res.headers.forEach === 'function') {
          res.headers.forEach((v, k) => {
            responseHeaders[k.toLowerCase()] = v;
          });
        }

        const contentType = res.headers?.get ? (res.headers.get('content-type') || '') : (responseHeaders['content-type'] || '');
        let parsedData = null;
        let textData = null;

        if (contentType.includes('application/json')) {
          try {
            parsedData = await res.json();
          } catch {
            parsedData = null;
          }
        } else {
          try {
            textData = await res.text();
            parsedData = textData;
          } catch {
            parsedData = null;
          }
        }

        const isOk = res.ok;
        const result = {
          data: isOk ? parsedData : null,
          error: !isOk ? (parsedData || textData || res.statusText || 'Request failed') : null,
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          ok: isOk,
          raw: res,
        };

        if (typeof defaultOptions.onResponse === 'function') {
          defaultOptions.onResponse(result);
        }
        if (typeof callOptions.onResponse === 'function') {
          callOptions.onResponse(result);
        }

        return result;
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        return {
          data: null,
          error: err.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : err.message,
          status: 0,
          statusText: 'Network Error',
          headers: {},
          ok: false,
          raw: null,
        };
      });
  }

  function createProxy(pathSegments = []) {
    return new Proxy(() => {}, {
      get(_target, prop) {
        if (typeof prop !== 'string') return undefined;

        // Common promise inspection
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }

        const lowerProp = prop.toLowerCase();
        if (HTTP_METHODS.includes(lowerProp)) {
          return (callOptions) => buildRequest(pathSegments, lowerProp, callOptions);
        }

        return createProxy([...pathSegments, prop]);
      },
      apply(_target, _thisArg, args) {
        // If called as function: api.users('123') or api('custom-path')
        if (args.length > 0 && (typeof args[0] === 'string' || typeof args[0] === 'number')) {
          return createProxy([...pathSegments, String(args[0])]);
        }
        return createProxy(pathSegments);
      },
    });
  }

  return createProxy([]);
}

export default createClient;
