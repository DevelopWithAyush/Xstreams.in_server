import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Crawls a website and discovers all internal URLs
 * @param {string} startUrl - The starting URL to crawl from
 * @param {number} maxPages - Maximum number of pages to crawl (default: 50)
 * @returns {Promise<string[]>} Array of discovered internal URLs
 */
export async function crawlWebsite(startUrl, maxPages = 50) {
    console.log(`🕷️ Starting crawl from: ${startUrl}`);

    const startUrlObj = new URL(startUrl);
    const baseDomain = startUrlObj.hostname;

    const visitedUrls = new Set();
    const urlsToVisit = [startUrl];
    const discoveredUrls = [];

    while (urlsToVisit.length > 0 && discoveredUrls.length < maxPages) {
        const currentUrl = urlsToVisit.shift();

        // Skip if already visited
        if (visitedUrls.has(currentUrl)) {
            continue;
        }

        visitedUrls.add(currentUrl);
        discoveredUrls.push(currentUrl);

        console.log(`📄 Crawling [${discoveredUrls.length}/${maxPages}]: ${currentUrl}`);

        try {
            const links = await extractLinksFromPage(currentUrl, baseDomain);

            // Add new internal links to the queue
            for (const link of links) {
                if (!visitedUrls.has(link) && !urlsToVisit.includes(link)) {
                    urlsToVisit.push(link);
                }
            }

        } catch (error) {
            console.warn(`⚠️ Failed to crawl ${currentUrl}: ${error.message}`);
            continue;
        }

        // Small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Crawl complete! Discovered ${discoveredUrls.length} pages`);
    return discoveredUrls;
}

/**
 * Extract internal links from a single page
 * @param {string} url - URL to extract links from
 * @param {string} baseDomain - Base domain to filter internal links
 * @returns {Promise<string[]>} Array of internal URLs found on the page
 */
async function extractLinksFromPage(url, baseDomain) {
    try {
        // Set timeout and headers for the request
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAuditor/1.0; +http://axto.ai)'
            },
            maxRedirects: 5
        });

        // Only process HTML content
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
            return [];
        }

        const $ = cheerio.load(response.data);
        const links = [];

        // Extract all href attributes from anchor tags
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (!href) return;

            try {
                // Convert relative URLs to absolute URLs
                const absoluteUrl = new URL(href, url);

                // Only include HTTP/HTTPS URLs from the same domain
                if (
                    (absoluteUrl.protocol === 'http:' || absoluteUrl.protocol === 'https:') &&
                    absoluteUrl.hostname === baseDomain
                ) {
                    // Remove fragment (hash) from URL
                    absoluteUrl.hash = '';
                    const cleanUrl = absoluteUrl.toString();

                    // Avoid duplicates and common non-content URLs
                    if (!links.includes(cleanUrl) && !isExcludedUrl(cleanUrl)) {
                        links.push(cleanUrl);
                    }
                }
            } catch (error) {
                // Skip invalid URLs
                return;
            }
        });

        return links;

    } catch (error) {
        // Return empty array if page can't be fetched
        return [];
    }
}

/**
 * Check if a URL should be excluded from crawling
 * @param {string} url - URL to check
 * @returns {boolean} True if URL should be excluded
 */
function isExcludedUrl(url) {
    const excludePatterns = [
        /\/wp-admin\//,
        /\/admin\//,
        /\/login/,
        /\/logout/,
        /\/register/,
        /\/cart/,
        /\/checkout/,
        /\/search\?/,
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i,
        /\.(jpg|jpeg|png|gif|svg|ico|webp)$/i,
        /\.(css|js|json|xml|txt)$/i,
        /mailto:/,
        /tel:/,
        /javascript:/,
        /#$/
    ];

    return excludePatterns.some(pattern => pattern.test(url));
} 