import { scraper } from '../dist';
const database = require('../dist/database/index').default;

describe('database', () => {
    test('manga', async () => {
        await new Promise(res => database.onDone(res));

        const url = new URL('https://mangakakalot.com/read-za9kj158504841983');
        const manga = await scraper.scrape(url);
        const { id } = await database.manga.add(manga);

        const m = await database.manga.get(id);
        const c = await database.chapters.get(id);

        expect(m).toBeDefined();
        expect(c).toBeDefined();

        const removed = await database.manga.remove(id);
        expect(removed).toBeTruthy();

        const c2 = await database.chapters.get(id);
        expect(c2.length).toEqual(0);
    });
});
