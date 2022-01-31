import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';

class Mangakakalot extends DOMMangaScraper {
    hostnames: string[] = [
        'isekaiscan.com',
        'm.mangabat.com',
        'mangabat.best',
        'mangakakalot.com',
        'mangakakalot.tv',
        'mangakakalots.com',
        'manganelo.com',
        'manganato.com',
        'read.mangabat.com',
        'readmanganato.com',
    ];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1',
            description: 'div:has(> h2:icontains(sum)), div:has(> h3:icontains(desc)), #panel-story-info-description',
            cover: 'meta[property="og:image"]',
            cover_attrs: ['content'],
            status: 'li:icontains(status), td:icontains(status) + td',
            alt_titles: 'h2:icontains(alt), h2.story-alternative, td:icontains(alt) + td',
            authors: 'li:icontains(author), td:icontains(author) + td a',
            genres: 'li:icontains(genre) a, td:icontains(genre) + td a',
            chapter: {
                href: 'div.chapter-list div.row span a, ul.row-content-chapter li a.chapter-name',
                posted: 'div.chapter-list div.row span[title], ul.row-content-chapter li span[title]',
                posted_attr: 'title',
            },
        },
        images: {
            image: 'div.container-chapter-reader img, div.vung-doc img',
        },
        search: {
            hostnames: [
                'mangakakalot.com/search/story',
                'mangakakalots.com/search',
                'manganato.com/search/story',
                'mangakakalot.tv/search',
            ],
            url: 'https://${hostname}/${query}',
            href: 'h3.story_name a, div.item-right h3 a',
            title: 'h3.story_name a, div.item-right h3 a',
            image: 'div.story_item a img, div.search-story-item a img',
            encode: false,
            updated: 'div.story_item_right span:icontains(updated), div.item-right span.item-time:icontains(updated)',
        },
        date_formats: ['MMM-DD-YYYY hh:mm:ss', 'MMM DD,YYYY - hh:mm', 'MMM-DD,YYYY hh:mm'],
    };

    override search(query: string, filterHostnames?: string[]) {
        query = query.replace(/ +/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        return super.search(query, filterHostnames);
    }
}

export default Mangakakalot;
