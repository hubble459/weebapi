import 'svelte';
import App from './App.svelte';

const app = new App({
    target: document.body,
});

new Worker('service-worker.js');

export default app;
