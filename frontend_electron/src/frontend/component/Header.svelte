<svelte:head>
    <link rel="stylesheet" href="fa/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
</svelte:head>

<nav>
    <a href="." class="logo">LOGO</a>
    <form action="/search">
        <input type="text" name="query" id="query" /><button type="submit" class="search_button"
            ><i class="fa fa-search fa-lg" /></button
        >
    </form>
    <a href="/genres">Genres</a>
</nav>

<style lang="scss">
    nav {
        background-color: var(--bg-alternative);

        form {
            display: inline;
            height: max-content;
            

            * {
                margin: 0;
                padding: 0;
                margin: .5em 0;
            }

            input {
                border-radius: 0.5em 0 0 0.5em;
                min-height: 2em;
                padding: 0 .5em;
            }

            button {
                border-radius: 0 0.5em 0.5em 0;
                background-color: var(--bg-secondary);
                border: var(--bg-secondary) solid 1px;
                outline: 0;
                min-height: 2em;
                color: white;
                padding: 0 .5em;
            }
        }

        a {
            color: var(--color-primary);
            padding: 1em 0.5em;

            &:hover {
                background-color: rgba($color: #000000, $alpha: 0.1);
            }
        }
    }
</style>
