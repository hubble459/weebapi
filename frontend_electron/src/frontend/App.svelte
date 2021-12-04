<script lang="ts">
    import router from 'page';

    import Header from './component/Header.svelte';
    import Home from './page/Home.svelte';
    import Genres from './page/Genres.svelte';
    import NotFound from './page/NotFound.svelte';

    let page: any = Home;
    router('/', () => page = Home);
    router('/genres', () => page = Genres);
    router.start();
</script>

<Header />
<main>
    <svelte:component this={page} />
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>
