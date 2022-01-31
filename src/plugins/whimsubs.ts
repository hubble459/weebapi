import { DOMWindow } from 'jsdom';
import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';
import fetch from 'node-fetch';

class WhimSubs extends DOMMangaScraper {
    hostnames: string[] = ['whimsubs.xyz'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1',
            description: 'pre',
            cover: 'div > img',
            status: 'li:has(> b:icontains(status)), li:icontains(status)',
            authors: 'td:contains(Author) + td a div',
            genres: 'td:contains(Tags) + td a div',
            chapter: {
                href: 'li.mdc-list-item > span > a',
                number: 'li.mdc-list-item > span.mdc-list-item__graphic',
                posted: 'li.mdc-list-item span.mdc-list-item__secondary-text',
            },
        },
        images: {
            image: 'img',
        },
        date_formats: ['YYYY.MM.DD'],
    };

    override chapters($: JQuery<DOMWindow>, title: string) {
        const dates = $(this.queries.parse.chapter.posted!);
        for (const date of dates) {
            date.textContent = date.textContent?.split(' by')[0].trim() || null;
        }
        return super.chapters($, title);
    }

    override async images(url: URL) {
        url.href += 'manifest.json';
        const json = await fetch(url.href).then((res) => res.json());
        const images = json.readingOrder as { href: string }[];
        return images.map((i) => i.href);
    }
}

export default WhimSubs;
