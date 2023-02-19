import fetch, { RequestInit } from 'node-fetch';
import deepmerge from 'deepmerge';

const noop = () => {};

export type Data = {
    [key: string]: any;
};

export type Queries = {
    [key: string]: string;
};

export type Headers = {
    [key: string]: string;
};

export type RestPath = {
    (...parts: string[]): Rest;
    [path: string]: Rest;
};

export type RestMethods = {
    toString(): string;
    valueOf(): string;
    _query(key: string, value: string): RestMethods;
    _queries(queries: Queries): RestMethods;
    _header(key: string, value: string): RestMethods;
    _headers(headers: Headers): RestMethods;
    _save: Rest;
    _get(): Promise<any>;
    _post(data?: Data): Promise<any>;
    _put(data?: Data): Promise<any>;
    _patch(data?: Data): Promise<any>;
    _delete(): Promise<any>;
};

export type Rest = RestMethods & RestPath;

const reflectors = ['toString', 'valueOf'];

const methods: Method[] = ['get', 'post', 'put', 'patch', 'delete'];

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestHandler {
    (method: Method, url: string, options: RestOptions, data?: Data): Promise<any>;
}

export type RestJSONOptions = {
    onlyJSON: boolean;
    throwIfNotJSON: boolean;
};

export type RestOptions = {
    encode: boolean;
    headers: Headers;
    json: RestJSONOptions;
    requestHandler: RequestHandler;
};

export const defaultOptions: Readonly<RestOptions> = {
    encode: true,
    json: {
        throwIfNotJSON: false,
        onlyJSON: true,
    },
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    requestHandler: async (
        method: Method,
        url: string,
        { headers, json: { throwIfNotJSON, onlyJSON } }: RestOptions,
        data?: Data
    ) => {
        const init: RequestInit = {
            method,
            headers,
        };
        if (data) {
            init.body = JSON.stringify(data);
        }
        
        const res = await fetch(url, init);
        let response;
        if (res.headers.get('Content-Type')?.includes('application/json')) {
            response = await res.json();
        } else if (throwIfNotJSON) {
            throw new Error('URL did not return a JSON response');
        } else {
            response = await res.text();
            if (onlyJSON) {
                response = {
                    text: response,
                };
            }
        }
        if (!res.ok) {
            throw response;
        }
        return response;
    },
};

export function rest(endpoint: string, options?: Partial<RestOptions>) {
    if (endpoint.endsWith('/')) {
        endpoint = endpoint.slice(0, -1);
    }
    const opts: RestOptions = deepmerge(defaultOptions, options || {});
    if (!opts.json || !opts.requestHandler) {
        throw new Error('Missing necessary options');
    }
    const orgHeaders = deepmerge({}, opts.headers);
    const route = [endpoint];
    let save: boolean = false;
    function joined() {
        let joined = '';
        for (const part of route) {
            joined += (/^\?|&/.test(part) || !joined ? '' : '/') + part;
        }
        return joined;
    }
    const handler: ProxyHandler<Rest> = {
        get: (_target, key) => {
            if (typeof key === 'symbol') {
                key = key.toString();
            }

            if (key === '_save') {
                save = true;
                return new Proxy<Rest>(noop as any, handler);
            } else if (key === '_header') {
                return ((key: string, value: string) => {
                    opts.headers[key] = value;
                    return new Proxy<Rest>(noop as any, handler);
                }) as RestMethods['_header'];
            } else if (key === '_headers') {
                return ((headers: Headers) => {
                    opts.headers = deepmerge(opts.headers, headers);
                    return new Proxy<Rest>(noop as any, handler);
                }) as RestMethods['_headers'];
            } else if (key === '_query') {
                return ((key: string, value: string) => {
                    if (key && value) {
                        const lastWasQuery = /[^=]+=[^=]+/.test(route.slice(-1)[0] || '');
                        let query = (route.find((r) => r.includes('?')) ? '' : '?') + `${key}=${value}`;
                        if (lastWasQuery) {
                            query = '&' + query;
                        }
                        route.push(query);
                    }

                    return new Proxy<Rest>(noop as any, handler);
                }) as Rest['_query'];
            } else if (key === '_queries') {
                return ((queries: Queries) => {
                    const lastWasQuery = /[^=]+=[^=]+/.test(route.slice(-1)[0] || '');
                    let query = route.find((r) => r.includes('?')) ? (lastWasQuery ? '&' : '') : '?';

                    for (const [key, value] of Object.entries(queries)) {
                        if (key && value !== undefined) {
                            query += `${key}=${value}&`;
                        }
                    }
                    route.push(query.slice(0, -1));

                    return new Proxy<Rest>(noop as any, handler);
                }) as Rest['_queries'];
            } else if (reflectors.includes(key)) {
                return () => joined();
            } else if (methods.includes(key.slice(1) as Method)) {
                const url = joined();
                if (!save) {
                    route.length = 0;
                    route.push(endpoint);
                    opts.headers = orgHeaders;
                } else {
                    save = false;
                }
                return (data?: Data) => opts.requestHandler((<string>key).slice(1) as Method, url, opts, data);
            } else {
                route.push(opts.encode ? encodeURIComponent(key) : key);
                return new Proxy<Rest>(noop as any, handler);
            }
        },
        apply: (_target, _self, args) => {
            route.push(...args.filter((a) => !!a).map((a) => (opts.encode ? encodeURIComponent(a) : a)));
            return new Proxy<Rest>(noop as any, handler);
        },
    };

    return new Proxy<Rest>(noop as any, handler);
}
