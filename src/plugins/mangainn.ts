import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';

export default class MangaInn extends DOMMangaScraper {
    hostnames: string[] = ['mangainn.net', 'mngdoom.com'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'div.content-inner.inner-page h5.widget-heading',
            description: 'div.note ul, div.note p span',
            cover: 'img.img-responsive.mobile-img',
            status: 'dt:contains(Status) + dd',
            alt_titles: 'dt:contains(Alt) + dd',
            authors: 'dt:contains(Author) + dd',
            genres: 'dt:contains(Categories) + dd',
            chapter: {
                href: '#chapter_list ul.chapter-list li a',
                title: '#chapter_list ul.chapter-list li a span.val',
                posted: '#chapter_list ul.chapter-list li a span.date',
            },
        },
        images: {
            image: 'div > img',
        },
    };

    override images(url: URL) {
        url.href += 'all-pages';
        return super.images(url);
    }
}
