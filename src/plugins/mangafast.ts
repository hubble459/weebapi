import { DOMWindow } from 'jsdom';
import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';
import { rest } from '../helpers/rest_api';
import SearchManga from '../models/search_manga';

type MangafastHit = {
    id: number;
    title: string;
    slug: string;
    alternative: string;
    comic_type: string;
    author: string;
    artist: string;
    language: string;
    comic_status: string;
    rating: number;
    views: number;
    genres: string;
    list_genres: string[];
    url_from: string;
    banner: string;
    thumbnail: string;
    synopsis: string;
    rewrite: null;
    status: number;
    web_result_id: number;
    previews: string;
    secondary_slug: string;
};

class Mangafast extends DOMMangaScraper {
    hostnames: string[] = ['mangafast.net'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'tr td:contains(Title) + td b',
            description: 'p[itemprop=description]',
            cover: 'div.sc img',
            cover_attrs: ['src'],
            status: 'tr td:contains(Status) + td',
            alt_titles: 'tr td:contains(Alt) + td',
            authors: 'tr td:contains(Author) + td',
            genres: 'tr td:contains(Genre) + td a',
            chapter: {
                href: '#table td a',
                title: '#table td a',
                posted: '#table td.tgs',
            },
        },
        images: {
            image: 'img.lazy',
            image_attrs: ['data-src'],
        },
    };

    readonly api = rest('https://search.mangafast.net/comics/ms', {
        headers: { mangafast: 'mangafast', Referer: 'https://mangafast.net/' },
    });

    override cover($: JQuery<DOMWindow>) {
        const url = super.cover($);
        return url?.split('?')[0] || undefined;
    }

    override async search(query: string) {
        const res = await this.api._post({
            q: query,
            limit: 30,
        });
        const hits: MangafastHit[] = res.hits;
        const manga: SearchManga[] = [];
        for (const hit of hits) {
            manga.push({
                title: hit.title,
                cover: hit.thumbnail,
                url: hit.url_from,
                hostname: 'mangafast.net',
                updated: -1,
            });
        }
        return manga;
    }
}

export default Mangafast;
