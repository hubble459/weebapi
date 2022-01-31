// @ts-ignore
import { scraper } from '../dist';
import MangaScraper from '../dist/helpers/manga/manga_scraper';

type Exclude = {
    chapter_posted?: boolean;
    alt_titles?: boolean;
    authors?: boolean;
    genres?: boolean;
    description?: boolean;
};

describe('dom', () => {
    describe('mangakakalot', () => {
        const urls: string[] = [
            'https://mangakakalot.com/read-za9kj158504841983',
            'https://readmanganato.com/manga-bl979094',
            'https://mangakakalot.com/manga/xz923297',
            'https://ww2.mangakakalots.com/manga/manga-ij985766',
            'https://manganato.com/manga-ia985483',
            'https://ww.mangakakalot.tv/manga/manga-ha985009',
            'https://read.mangabat.com/read-lj42906',
        ];

        testURLS(urls);
    });

    describe('readm', () => {
        const urls = ['https://readm.org/manga/16160'];

        testURLS(urls);
    });

    // describe('lhtranslation', () => {
    //     const urls = [''];

    //     testURLS(urls);
    // });

    describe('whimsubs', () => {
        const urls = ['https://whimsubs.xyz/r/series/shikkaku-kara-hajimeru-nariagari-madou-shidou/'];

        testURLS(urls, { description: true, alt_titles: true });
    });

    describe('mangafast', () => {
        const urls = ['https://mangafast.net/read/the-beginning-after-the-end/'];

        testURLS(urls);
    });

    describe('mangainn', () => {
        const urls = [
            'https://www.mangainn.net/ore-no-ie-ga-maryoku-spot-datta-ken-sundeiru-dake-de-sekai-saikyou',
            'https://www.mngdoom.com/star-martial-god-technique',
        ];

        testURLS(urls);
    });

    describe('madara', () => {
        const urls = [
            // !401 'https://1stkissmanga.io/manga/magic-emperor/',
            'https://azmanhwa.net/manga/the-eunuchs-consort-rules-the-world/',
            'https://isekaiscanmanga.com/manga/magic-emperor/',
            'https://lhtranslation.net/manga/the-red-ranger-becomes-an-adventurer-in-another-world/',
            'https://manga347.com/manga/magic-emperor/',
            'https://manga68.com/manga/magic-emperor/',
            'https://mangachill.com/manga/the-eunuchs-consort-rules-the-world/',
            'https://mangafoxfull.com/manga/magic-emperor/',
            // !500 'https://mangafunny.com/manga/past-lives-of-the-thunder-god/',
            'https://mangahz.com/read/positively-yours/',
            'https://mangakik.com/manga/magic-emperor/',
            'https://mangarockteam.com/manga/the-eunuchs-consort-rules-the-world/',
            'https://mangasushi.net/manga/welcome-to-the-cheap-restaurant-of-outcasts-1954/',
            'https://mangatx.com/manga/lightning-degree/',
            // !403 'https://mangaweebs.in/manga/i-raised-the-beast-well/',
            'https://mangazukiteam.com/manga/the-eunuchs-consort-rules-the-world/',
            'https://manhuadex.com/manhua/the-eunuchs-consort-rules-the-world/',
            'https://manhuaus.com/manga/magic-emperor/',
            // !403 'https://s2manga.com/manga/under-the-oak-tree/',
            'https://247manga.com/manhwa/a-way-to-protect-the-lovable-you/',
            'https://yaoi.mobi/manga/stack-overflow-raw-yaoi0003/',
            // ! not madara 'https://reaperscans.com/series/kill-the-hero/',
            'https://mixedmanga.com/manga/the-eunuchs-consort-rules-the-world/',
            // !403 'https://manhuaplus.com/manga/demon-magic-emperor/',
            // !403 'https://manhwatop.com/manga/magic-emperor/',
        ];

        testURLS(urls);
    });

    describe('mangastream', () => {
        const urls: string[] = [
            'http://mangastream.mobi/manga/the-unfavorable-job-appraiser-is-actually-the-strongest',
            'http://mangabat.best/manga/my-little-baby-prince',
            'http://kissmanga.nl/manga/because-im-an-uncle-who-runs-a-weapon-shop',
            // !403 'https://isekaiscan.com/manga/gusha-no-hoshi/',
        ];

        testURLS(urls, { chapter_posted: true });
    });

    describe('mangafreak', () => {
        const urls: string[] = [
            'http://mangafreak.cloud/manga/isekai-cheat-magic-swordsman',
            'http://mangarockteam.site/manga/the-hidden-saintess',
        ];

        testURLS(urls, { chapter_posted: true });
    });

    describe('zeroscans', () => {
        const urls: string[] = [
            'https://zeroscans.com/comics/636122-hero-i-quit-a-long-time-ago',
            'https://the-nonames.com/comics/241705-danshi-koukousei-wo-yashinaitai-onee-san-no-hanashi',
        ];

        testURLS(urls, { alt_titles: true, genres: true, authors: true });
    });

    test('all scrapers', async () => {
        await expect(scraper.scrape(new URL('https://google.com/'))).rejects.toThrowError('No scraper for this url');
    });
});

function testURLS(urls: string[], exclude: Exclude = {}) {
    for (const url of urls) {
        const u = new URL(url);
        test(
            u.hostname,
            async () => {
                await fullManga(scraper, u, exclude);
            },
            500000
        );
    }
}

async function fullManga(scraper: MangaScraper, url: URL, exclude: Exclude) {
    expect(scraper.handles(url.hostname)).toBeTruthy();
    const manga = await scraper.scrape(url);
    expect(manga.url).toBeTruthy();
    expect(manga.title).toBeTruthy();
    if (!exclude.description) {
        expect(manga.description).toBeTruthy();
    }
    expect(manga.cover).toBeTruthy();
    if (!exclude.alt_titles) {
        expect(manga.alt_titles.length).toBeGreaterThan(0);
    }
    if (!exclude.genres) {
        expect(manga.genres.length).toBeGreaterThan(0);
    }
    if (!exclude.authors) {
        expect(manga.authors.length).toBeGreaterThan(0);
    }
    expect(manga.chapters.length).toBeGreaterThan(0);

    for (const chapter of manga.chapters) {
        expect(chapter.url).toBeTruthy();
        expect(chapter.title).toBeTruthy();
        expect(chapter.number).toBeGreaterThan(-1);
        if (!exclude.chapter_posted) {
            expect(chapter.posted).toBeGreaterThan(-1);
        }
    }

    expect(manga.updated).toBeGreaterThan(-1);

    const images = await scraper.images(new URL(manga.chapters[0].url));
    expect(images.length).toBeGreaterThan(0);

    if (scraper.search) {
        const results = await scraper.search('a', [url.hostname]);  
    }
    return { manga, images };
}
