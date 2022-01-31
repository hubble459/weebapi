import { rest } from '../dist/helpers/rest_api';
import type Manga from '../dist/models/manga';

const port = process.env.PORT || 3000;
process.env.PORT = String(port);
const apiV1 = rest(`http://localhost:${port}/api/v1`);

describe('api', function () {
    test('manga:get', async () => {
        const results: { manga: Manga[]; offset: number; limit: number; total: number } = await apiV1.manga
            ._queries({ limit: '20', offset: '1' })
            ._get();
        expect(Array.isArray(results.manga)).toBeTruthy();
        expect(results.offset).toEqual(1);
        expect(results.limit).toEqual(20);
        expect(results.total).toBeGreaterThanOrEqual(0);
    });

    test('manga:url', async () => {
        const manga: Manga = await apiV1.manga._query('url', 'https://mangakakalot.com/manga/ib925077')._get();
        expect(manga).toBeTruthy();
        const mangaSaved: Manga = await apiV1.manga(manga.id + '')._get();
        expect(mangaSaved).toBeTruthy();
    });

    test('manga:images', async () => {
        const manga: Manga = await apiV1.manga._query('url', 'https://mangakakalot.com/manga/ib925077')._get();
        const chapter = manga.chapters[0];
        expect(chapter).toBeDefined();
        const images = await apiV1.manga.images._query('url', chapter.url)._get();
        expect(images).toBeTruthy();
        expect(Array.isArray(images)).toBeTruthy();
    });

    test('manga:patch', async () => {
        const manga: Manga = await apiV1.manga._query('url', 'https://mangakakalot.com/manga/ib925077')._get();
        const patched: Manga = await apiV1
            .manga(manga.id + '')
            ._patch({ url: 'https://m.mangabat.com/read-pq393435/' });
        expect(manga.hostname).not.toEqual(patched.hostname);
    });

    test('user:register', async () => {
        const user = await apiV1.user._post({
            username: 'meep',
            password: 'p@ssword123',
        });
        expect(user).toBeDefined();
    });

    test('user:login', async () => {
        const token = await apiV1.user.login._post({
            username: 'meep',
            password: 'p@ssword123',
        });
        expect(token).toBeDefined();
    });

    test('user:get', async () => {
        const result = await apiV1.user._get();
        expect(Array.isArray(result.users)).toBeTruthy();
    });
});
