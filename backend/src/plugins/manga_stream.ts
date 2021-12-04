import { DOMWindow } from 'jsdom';
import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';
import { parseStatus } from '../helpers/manga/parse';

type InfoData = {
    alternative: string[];
    artists: string[];
    authors: string[];
    genre: string[];
    release: string;
    status: string;
    type: string;
    view: string;
};

class MangaStream extends DOMMangaScraper {
    hostnames: string[] = ['mangastream.mobi', 'mangabat.best', 'kissmanga.nl'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1.title-manga',
            description: '#example2',
            cover: 'div[class*=cover] img',
            status: 'p.description-update',
            alt_titles: 'p.description-update',
            authors: 'p.description-update',
            genres: 'p.description-update',
            chapter: {
                href: 'li.row div.chapter.col-xs-12 h4 a',
                title: 'li.row div.chapter.col-xs-12 h4 a',
                posted: 'li.row div.text-center.small',
            },
        },
        images: {
            image: 'img',
        },
        date_formats: ['MMM DD, hh:mm', 'MMM DD YYYY, hh:mm'],
    };

    override async images(url: URL) {
        const { $ } = await this.getPage(url);
        const data = $('#arraydata').text();
        const images = data.split(',');
        return images;
    }

    override title($: JQuery<DOMWindow>) {
        return super.title($).replace(/ manga$/i, '');
    }

    override async chapters($: JQuery<DOMWindow>, title: string) {
        return (await super.chapters($, title)).map((ch) => {
            ch.title = ch.title.replace(/^ ?: /, '');
            return ch;
        });
    }

    override status($: JQuery<DOMWindow>) {
        const query = this.queries.parse.status;
        if (query) {
            const element = $(query).first();
            const info = this.splitInfo(element);
            return parseStatus(info.status);
        } else {
            return true;
        }
    }

    override altTitles($: JQuery<DOMWindow>) {
        const query = this.queries.parse.alt_titles;
        if (query) {
            const element = $(query).first();
            const info = this.splitInfo(element);
            return info.alternative;
        } else {
            return [];
        }
    }

    override genres($: JQuery<DOMWindow>) {
        const query = this.queries.parse.genres;
        if (query) {
            const element = $(query).first();
            const info = this.splitInfo(element);
            return info.genre;
        } else {
            return [];
        }
    }

    override authors($: JQuery<DOMWindow>) {
        const query = this.queries.parse.authors;
        if (query) {
            const element = $(query).first();
            const info = this.splitInfo(element);
            return info.authors;
        } else {
            return [];
        }
    }

    private splitInfo(element: JQuery<HTMLElement>) {
        const split = element
            .text()
            .split('\n')
            .map((t) => t.trim())
            .filter((t) => !!t);
        const obj: any = {};
        let last: string = '';
        for (const part of split) {
            const set = part.split(':');
            const key = set[0].trim().toLowerCase().replace(/\(|\)/g, '');
            const value = set[1]?.trim();
            if (last && key?.endsWith(',')) {
                obj[last] = [...(obj[last] || []), key.slice(0, -1)];
            } else {
                last = key;
                obj[key] = value;
            }
        }
        const info: InfoData = obj as InfoData;
        info.alternative = obj.alternative ? [obj.alternative] : [];
        info.authors = obj.authors ? obj.authors.split(',') : [];
        info.artists = obj.artists ? [obj.artists] : [];
        return info;
    }
}

export default MangaStream;
