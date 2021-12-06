const { rest } = require('./dist/helpers/rest_api');

const port = process.env.PORT || 3000;
process.env.PORT = String(port);
const apiV1 = rest(`http://localhost:${port}/api/v1`);

(async () => {
    const manga = await apiV1.manga._query('url', 'https://mangakakalot.com/manga/ib925077')._get();
    const patched = await apiV1
        .manga(manga.id + '')
        ._patch({ url: 'https://1stkissmanga.io/manga/reincarnated-war-god/' });
    console.log(patched);
})().catch(console.error);
