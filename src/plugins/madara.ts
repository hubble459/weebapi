import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';
import { DOMWindow, JSDOM } from 'jsdom';
import jQuery from 'jquery';
import fetch from 'node-fetch';

class Madara extends DOMMangaScraper {
    // sites with url/ajax/chapters
    specialAJAX: string[] = [
        'lhtranslation.net',
        'mangakik.com',
        'mangasushi.net',
        'manhuaus.com',
        'mangachill.com',
    ];

    noAJAX: string[] = [
        'mangahz.com',
        'reaperscans.com',
        'mangarockteam.com',
        'manhuaplus.com',
        '1stkissmanga.io',
        'azmanhwa.net',
    ];

    hostnames: string[] = [
        '1stkissmanga.club',
        '1stkissmanga.io',
        '1stkissmanga.com',
        '1stkissmanga.love',
        '247manga.com',
        'azmanhwa.net',
        'isekaiscanmanga.com',
        'manga347.com',
        'manga68.com',
        'mangachill.com',
        'mangafoxfull.com',
        'mangafunny.com',
        'mangahz.com',
        'mangakik.com',
        'mangarockteam.com',
        'mangasushi.net',
        'mangatx.com',
        'mangaweebs.in',
        'mangazukiteam.com',
        'manhuadex.com',
        'manhuaplus.com',
        'manhuaus.com',
        'manhwatop.com',
        'mixedmanga.com',
        'reaperscans.com',
        's2manga.com',
        'topmanhua.com',
        'yaoi.mobi',
        'zinmanga.com',
        'lhtranslation.net'
    ];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1',
            description:
                'div.description-summary div.summary__content p, div.description-summary div.summary__content.show-more h3, div.description-summary div.summary__content',
            cover: 'div.summary_image img',
            cover_attrs: ['data-src', 'data-lazy-src', 'src'],
            status: 'div.summary-heading:has(> h5:icontains(status)) + div',
            alt_titles: 'div.summary-heading:has(> h5:icontains(alt)) + div',
            authors: 'div.author-content a, div.author-content:not(:has(a))',
            genres: 'div.genres-content a',
            chapter: {
                href: 'li.wp-manga-chapter > a',
                posted: 'li.wp-manga-chapter > span.chapter-release-date > i, li.wp-manga-chapter > span.chapter-release-date a',
                posted_attr: 'title',
            },
        },
        images: {
            image: 'div > img[id*=image-], figure > img[class*=image-], li figure img, div.text-left p img',
            image_attrs: ['data-lazy-src', 'src'],
        },
        search: {
            url: 'https://${hostname}/?post_type=wp-manga&s=${query}',
            href: 'h3.h4 a',
            title: 'h3.h4 a',
            image: 'div.tab-thumb > a > img',
            image_attrs: ['data-src', 'data-lazy-src', 'src'],
            updated: 'div.post-on span.font-meta:not(:has(a)), div.post-on span.font-meta a',
            updated_attr: 'title',
            encode: true,
        },
        date_formats: ['DD MMMM, YYYY', 'MMMM DD, YYYY', 'DD MMM hh:mm', 'DD/MM/YYYY'],
    };

    override async chapters($: JQuery<DOMWindow>, title: string) {
        const el = $('input.rating-post-id, #wp-manga-js-extra, body').first();
        const loc = el.get(0)?.ownerDocument.location;
        if (!loc) return [];
        if (this.specialAJAX.includes(loc.hostname)) {
            const chapterURL = loc.href + 'ajax/chapters/';
            const text = await fetch(
                chapterURL,
                { method: 'POST' }
            ).then((res) => res.text());

            const window = new JSDOM(text).window;
            $ = jQuery(window);
            // @ts-ignore
            $.expr[':'].icontains = (obj: any, _index: number, meta: any[]) => {
                return $(obj).text().toLowerCase().indexOf(meta[3].toLowerCase()) !== -1;
            };
        } else if (!this.noAJAX.includes(loc.hostname)) {
            let id = el.attr('value');
            if (!id) {
                const script = el.text();
                const match = script.match(/"manga_id":"(?<id>\d+)"/);
                if (match) {
                    id = match.groups!.id;
                } else {
                    throw new Error('Manga ID could not be determined');
                }
            }

            const params = new URLSearchParams();
            params.append('action', 'manga_get_chapters');
            params.append('manga', id);

            const url = new URL(loc.href);

            const text = await fetch(
                `${url.protocol}//${url.hostname}/wp-admin/admin-ajax.php`,
                { method: 'POST', body: params as any }
            ).then((res) => res.text());
            const window = new JSDOM(text).window;
            $ = jQuery(window);
            // @ts-ignore
            $.expr[':'].icontains = (obj: any, _index: number, meta: any[]) => {
                return $(obj).text().toLowerCase().indexOf(meta[3].toLowerCase()) !== -1;
            };
        }

        return super.chapters($, title);
    }

    override cover($: JQuery<DOMWindow>) {
        const cover = super.cover($);
        if (cover) {
            const href = cover.replace(/-\d+x\d+(\.\w+)$/, '$1');
            return href || undefined;
        }
        return undefined;
    }

    override async search(query: string, hostnames?: string[]) {
        return (await super.search(query, hostnames)).map((m) => {
            m.cover = m.cover ? m.cover.replace(/-\d+x\d+(\.\w+)$/, '$1') : m.cover;
            return m;
        });
    }
}

export default Madara;
