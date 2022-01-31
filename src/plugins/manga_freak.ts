import DOMMangaScraper, { DOMMangaScraperQueries } from '../helpers/manga/dom_manga_scraper';

class MangaFreak extends DOMMangaScraper {
    hostnames: string[] = ['mangafreak.cloud', 'mangarockteam.site'];
    queries: DOMMangaScraperQueries = {
        parse: {
            title: 'h1',
            description: '#noidungm',
            cover: 'div.imgdesc img, div.manga-info-pic img',
            status: 'li:has(> b:icontains(status)), li:icontains(status)',
            alt_titles: 'li:has(> b:icontains(alternative)), span.story-alternative',
            authors: 'li:has(> b:icontains(author)), li:icontains(author)',
            genres: 'li:has(> b:icontains(genre)):not(:has(a)), li:icontains(genre) a',
            chapter: {
                href: 'div.cl li span a, div.row span > a',
                posted: 'div.cl li span + span, div.chapter-list div.row > span + span',
            },
        },
        images: {
            image: 'img',
        },
        date_formats: ['DDD MMM DD YYYY, hh:mm'],
    };

    override async images(url: URL) {
        const { $ } = await this.getPage(url);
        const data = $('#arraydata').text();
        const images = data.split(',');
        return images;
    }
}

export default MangaFreak;
