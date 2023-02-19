import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';

class ReadM extends DOMMangaScraper {
    hostnames: string[] = ['readm.org'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1.page-title',
            description: 'p span',
            cover: 'img.series-profile-thumb',
            status: 'span.series-status.aqua',
            alt_titles: 'div.sub-title.pt-sm',
            authors: '#first_episode a small',
            genres: 'div.series-summary-wrapper div.ui.list div.item a',
            chapter: {
                href: 'div.season_start table tbody tr td h6 a',
                posted: 'div.season_start table tbody tr td.episode-date',
            },
        },
        images: {
            image: 'center img',
        },
    };
}

export default ReadM;
