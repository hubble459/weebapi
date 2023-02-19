import MangaScraper from './manga_scraper';
import moment from 'moment';
import { DOMWindow, JSDOM } from 'jsdom';
import jQuery from 'jquery';
import { numberFromTitle, parseStatus, toTime } from './parse';
import SearchManga from '../../models/search_manga';
import { ScrapedChapter, ScrapedManga } from '../../models/scraped';

declare global {
    interface JQuery<TElement = HTMLElement> {
        (query: string): JQuery<HTMLElement>;
    }
}

export interface DOMMangaScraperQueries {
    parse: {
        title: string;
        title_attr?: string;
        description?: string;
        description_attr?: string;
        cover?: string;
        cover_attrs?: string[];
        status?: string;
        status_attr?: string;
        alt_titles?: string;
        alt_titles_attr?: string;
        authors?: string;
        authors_attr?: string;
        genres?: string;
        genres_attr?: string;
        chapter: {
            href: string;
            href_attr?: string;
            title?: string;
            title_attr?: string;
            posted?: string;
            posted_attr?: string;
            number?: string;
            number_attr?: string;
        };
    };
    images: {
        image: string;
        image_attrs?: string[];
    };
    search?: {
        url: string;
        href: string;
        href_attr?: string;
        title: string;
        title_attr?: string;
        image: string;
        image_attrs?: string[];
        updated?: string;
        updated_attr?: string;
        hostnames?: string[];
        encode: boolean;
    };
    date_formats?: string[];
}

export default abstract class DOMMangaScraper implements MangaScraper {
    abstract readonly hostnames: string[];
    protected abstract readonly queries: DOMMangaScraperQueries;
    handles(hostname: string) {
        hostname = hostname.replace(/^ww(w|\d)?\./, '');
        for (const accepts of this.hostnames) {
            if (accepts.includes(hostname) || hostname.includes(accepts)) {
                return true;
            }
        }
        return false;
    }

    async getPage(url: URL) {
        const window = await JSDOM.fromURL(url.href, {
            userAgent:
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
        }).then((jsdom) => jsdom.window);
        const $ = jQuery(window);
        // @ts-ignore
        $.expr[':'].icontains = (obj: any, _index: number, meta: any[]) => {
            return $(obj).text().toLowerCase().indexOf(meta[3].toLowerCase()) !== -1;
        };

        return { $, window };
    }

    async images(url: URL) {
        const { $ } = await this.getPage(url);
        const images = $(this.queries.images.image);
        const attr = this.queries.images.image_attrs || ['src'];
        return images.map((_i, img) => this.absUrl(img, ...attr, 'data-src')?.href).toArray();
    }

    async scrape(url: URL): Promise<ScrapedManga> {
        const { $, window } = await this.getPage(url);

        const title = this.title($);
        const chapters = await this.chapters($, title);
        const manga: ScrapedManga = {
            url: window.location.href,
            hostname: window.location.hostname,
            title,
            description: this.description($),
            cover: this.cover($),
            status: this.status($),
            alt_titles: this.altTitles($),
            authors: this.authors($),
            genres: this.genres($),
            chapters,
            updated: !!chapters[0] && !!chapters[0].posted ? new Date(chapters[0].posted) || new Date() : new Date(),
        };
        return manga;
    }

    async search(query: string, filterHostnames: string[] = []): Promise<SearchManga[]> {
        const results: SearchManga[] = [];

        if (this.queries.search) {
            const hrefQuery = this.queries.search.href;
            const titleQuery = this.queries.search.title || hrefQuery;
            const imageQuery = this.queries.search.image;
            const updatedQuery = this.queries.search.updated;

            const hrefAttr = this.queries.search.href_attr || 'href';
            const titleAttr = this.queries.search.title_attr;
            const imageAttr = this.queries.search.image_attrs || ['src'];
            const updatedAttr = this.queries.search.updated_attr;

            if (this.queries.search.encode) {
                query = encodeURIComponent(query);
            }

            const hostnames = (this.queries.search.hostnames || this.hostnames).filter(
                (hn) =>
                    !filterHostnames.length ||
                    filterHostnames.includes(hn) ||
                    !!filterHostnames.find((fhn) => hn.includes(fhn))
            );
            const searchUrl = this.queries.search.url;
            const urls: URL[] = [];
            let len = 1;
            if (searchUrl.includes('${hostname}')) {
                len = hostnames.length;
            }
            for (let i = 0; i < len; i++) {
                const surl = searchUrl.replace(/\${hostname}/g, hostnames[i]).replace(/\${query}/g, query);
                urls.push(new URL(surl));
            }

            for (const url of urls) {
                try {
                    const { $ } = await this.getPage(url);

                    const hrefs = $(hrefQuery);
                    const titles = titleQuery === hrefQuery ? hrefs : $(titleQuery);
                    const images = $(imageQuery);
                    let updateds: JQuery<HTMLElement> | undefined;
                    if (updatedQuery) {
                        updateds = $(updatedQuery);
                    }

                    for (let i = 0; i < hrefs.length; i++) {
                        try {
                            const url = this.absUrl(hrefs.get(i), hrefAttr);
                            const title = (
                                (titleAttr ? titles.get(i)?.getAttribute(titleAttr) : titles.get(i)?.textContent) || ''
                            ).trim();
                            if (!title.length) continue;
                            const cover = this.absUrl(
                                images.get(i), //.querySelector('a > img'),
                                ...imageAttr,
                                'data-src'
                            );
                            let updatedString =
                                updateds && updateds.length
                                    ? updatedAttr
                                        ? updateds.get(i)?.getAttribute(updatedAttr) || updateds.get(i)?.textContent
                                        : updateds.get(i)?.textContent
                                    : null;
                            let updated: number = -1;
                            if (updatedString) {
                                updatedString = updatedString.replace(/^updated *[:=\-~\n\r\t]* */i, '');
                                if (+updatedString) {
                                    updated = +updatedString;
                                } else {
                                    const formats = this.queries.date_formats;
                                    if (formats?.length) {
                                        for (const format of formats) {
                                            const mom = moment(updatedString, format);
                                            if (mom.isValid()) {
                                                updated = mom.valueOf();
                                                break;
                                            }
                                        }
                                    } else {
                                        updated = moment(updatedString).valueOf();
                                    }
                                }
                                if (!updated) {
                                    updated = toTime(updatedString);
                                }
                            }

                            results.push({
                                url: url.href,
                                hostname: url.hostname,
                                title,
                                cover: cover.href,
                                updated,
                            });
                        } catch (e: any) {
                            console.error(e);
                            console.trace(url);

                        }
                    }
                } catch (e: any) {
                    console.error(e);
                    console.trace(url);
                }
            }
        }
        return results;
    }

    protected title($: JQuery<DOMWindow>): string {
        const element = $(this.queries.parse.title)!;
        const attr = this.queries.parse.title_attr;
        return (attr ? element.attr(attr)! : element.text()).trim();
    }

    protected description($: JQuery<DOMWindow>): string {
        const query = this.queries.parse.description;
        if (query) {
            const element = $(query).first();
            const attr = this.queries.parse.description_attr;
            const description = attr ? element.attr(attr)! : element.text();
            return description.replace(/.*(description|summary) *[:=\-~\n\r\t]* */i, '').trim();
        } else {
            return '';
        }
    }

    protected cover($: JQuery<DOMWindow>): string | undefined {
        const query = this.queries.parse.cover;
        if (query) {
            const element = $(query).get(0);
            const attrs = this.queries.parse.cover_attrs || ['src'];
            return element ? this.absUrl(element, ...attrs, 'data-src')?.href : undefined;
        } else {
            return undefined;
        }
    }

    protected status($: JQuery<DOMWindow>): boolean {
        const query = this.queries.parse.status;
        if (query) {
            const element = $(query).first();
            const attr = this.queries.parse.status_attr;
            const status = attr ? element.attr(attr)! : element.text();
            return parseStatus(status);
        } else {
            return true;
        }
    }

    protected altTitles($: JQuery<DOMWindow>): string[] {
        const query = this.queries.parse.alt_titles;
        let altTitles: string[] = [];
        if (query) {
            const elements = $(query);
            const attr = this.queries.parse.alt_titles_attr;

            if (elements.length > 1) {
                altTitles = elements
                    .map((_i, element) => (attr ? element.getAttribute(attr) : element.textContent))
                    .toArray();
            } else {
                altTitles = elements
                    .text()
                    .trim()
                    .replace(/(alt(ernative)?( title(\(?s\)?)?)? ?[;:,|\\/] ?)/i, '')
                    .replace(/(other( name(\(?s\)?)?)? ?[;:,|\\/] ?)/i, '')
                    .split(/ ?[;:,|\\/] ?/);
            }
            altTitles = altTitles.filter((a) => !!a).map((a) => a.trim());
        }
        return altTitles;
    }

    protected authors($: JQuery<DOMWindow>): string[] {
        const query = this.queries.parse.authors;
        let authors: string[] = [];
        if (query) {
            const elements = $(query);
            const attr = this.queries.parse.authors_attr;

            if (elements.length > 1) {
                authors = elements
                    .map((_i, element) => (attr ? element.getAttribute(attr) : element.textContent))
                    .toArray();
            } else {
                authors = elements
                    .text()
                    .replace(/\r|\n|(author\(?s?\)? ?[;:,|\\/] ?)/i, '')
                    .trim()
                    .split(/ ?[;:,|\\/] ?/);
            }
            authors = authors.filter((a) => !!a && !/author\(?s?\)?/i.test(a)).map((a) => a.trim());
        }

        return authors;
    }

    protected genres($: JQuery<DOMWindow>): string[] {
        const query = this.queries.parse.genres;
        let genres: string[] = [];
        if (query) {
            const elements = $(query);
            const attr = this.queries.parse.genres_attr;

            if (elements.length > 1) {
                genres = elements
                    .map((_i, element) => (attr ? element.getAttribute(attr) : element.textContent))
                    .toArray();
            } else {
                genres = elements
                    .text()
                    .replace(/\r|\n|(genre\(?s\)? ?[;:,|\\/] ?)/i, '')
                    .trim()
                    .split(/ ?[;:,|\\/] ?/);
            }
            genres = genres.filter((g) => !!g).map((g) => g.trim());
        }

        return genres;
    }

    protected async chapters($: JQuery<DOMWindow>, mangaTitle: string): Promise<ScrapedChapter[]> {
        const chapters: ScrapedChapter[] = [];

        const hrefAttr = this.queries.parse.chapter.href_attr || 'href';
        const titleAttr = this.queries.parse.chapter.title_attr;
        const numberAttr = this.queries.parse.chapter.number_attr;
        const postedAttr = this.queries.parse.chapter.posted_attr;

        const hrefQuery = this.queries.parse.chapter.href;
        const titleQuery = this.queries.parse.chapter.title;
        const postedQuery = this.queries.parse.chapter.posted;
        const numberQuery = this.queries.parse.chapter.number;

        const hrefs = $(hrefQuery);
        const titles = titleQuery ? (titleQuery === hrefQuery ? hrefs : $(titleQuery)) : hrefs;
        const posteds = postedQuery ? $(postedQuery) : null;
        const numbers = numberQuery ? $(numberQuery) : null;

        for (let i = 0; i < hrefs.length; i++) {
            const url = this.absUrl(hrefs.get(i), hrefAttr);
            const title = (
                titles && titles.length >= i
                    ? (titleAttr ? titles.get(i)?.getAttribute(titleAttr) : titles.get(i)?.textContent) ||
                      `Chapter ${i}`
                    : `Chapter ${i}`
            )
                .replace(mangaTitle, '')
                .trim();
            const number =
                numbers && numbers.length
                    ? Number.parseInt(
                          numberAttr ? numbers.get(i)!.getAttribute(numberAttr)! : numbers.get(i)!.textContent!
                      )
                    : numberFromTitle(title);
            
            const postedEl = posteds && posteds.length >= i ? posteds.get(i) : undefined;
            let postedString = postedEl
                ? postedAttr
                    ? postedEl.getAttribute(postedAttr) || postedEl.textContent
                    : postedEl.textContent
                : undefined;
            postedString = postedString?.trim();

            let posted: number = -1;
            if (postedString) {
                if (+postedString) {
                    posted = +postedString;
                } else {
                    postedString = postedString
                        .replace('today', new Date().toDateString().slice(4))
                        .replace('yesterday', new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString().slice(4));

                    const formats = this.queries.date_formats;
                    if (formats?.length) {
                        for (const format of formats) {
                            const mom = moment(postedString, format);
                            if (mom.isValid()) {
                                posted = mom.valueOf();
                                break;
                            }
                        }
                    } else {
                        posted = Date.parse(postedString);
                    }
                }
                if (!posted || posted === -1) {
                    posted = toTime(postedString);
                }
            }

            chapters.push({
                url: url.href,
                hostname: url.hostname,
                title,
                number,
                posted: new Date(posted),
            });
        }

        return chapters;
    }

    private absUrl(element?: Element | null, ...attrs: string[]) {
        if (!element) {
            throw new Error('Element is undefined');
        }
        attrs = this.makeUnique(attrs);
        let value: string | null | undefined;
        for (const attr of attrs) {
            value = element.getAttribute(attr);
            if (value) {
                break;
            }
        }

        if (!value) {
            throw new Error(`Element does not have (any of) [${attrs.join(' ')}] attribute`);
        } else {
            value = value.trim();
            const regex = /((https?:\/\/)?(ww\w?\.)?(\w+\.?)+(\.\w+))?\/[^ ()]*/;
            const match = value.match(regex);
            if (match) {
                value = match[0];
            }
        }

        if (!/^https?:\/\//.test(value)) {
            const url = new URL(element.ownerDocument.location.href);
            if (/^\/\//.test(value)) {
                value = url.protocol + value;
            } else {
                value = url.protocol + url.hostname + (value.startsWith('/') ? '' : '/') + value;
            }
        }
        return new URL(value);
    }

    private makeUnique(a: string[]) {
        const seen: any = {};
        return a.filter((item) => (seen.hasOwnProperty(item) ? false : (seen[item] = true)));
    }
}
