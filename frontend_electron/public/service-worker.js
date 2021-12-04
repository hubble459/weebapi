'use strict';

/**
 * Fetch the asset from the network and store it in the cache.
 * Fall back to the cache if the user is offline.
 */
async function fetchAndCache(request) {
    const cache = await caches.open(`offline`);

    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (err) {
        const response = await cache.match(request);
        if (response) return response;

        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.headers.has('range')) return;

    const url = new URL(event.request.url);

    // don't try to handle e.g. data: URIs
    const isHttp = url.protocol.startsWith('http');
    const isDevServerRequest = url.hostname === self.location.hostname && url.port !== self.location.port;

    if (isHttp && !isDevServerRequest) {
        event.respondWith(
            (async () => {
                // always serve static files and bundler-generated assets from cache.
                // if your application has other URLs with data that will never change,
                // set this variable to true for them and they will only be fetched once.
                const cachedAsset = await caches.match(event.request);

                return cachedAsset || fetchAndCache(event.request);
            })()
        );
    }
});
