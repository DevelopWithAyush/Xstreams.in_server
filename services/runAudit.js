import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

/**
 * Run Lighthouse audit on a single URL
 * @param {string} url - URL to audit
 * @param {Object} options - Audit options
 * @returns {Promise<Object>} Audit results in structured format
 */
export async function runAudit(url, options = {}) {
    let browser;
    let page;

    try {
        console.log(`🔍 Auditing: ${url}`);

        // Enhanced browser configuration for production environments
        const isProduction = process.env.NODE_ENV === 'production';

        const browserOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-background-networking',
                '--disable-sync',
                '--metrics-recording-only',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                '--disable-component-extensions-with-background-pages',
                '--disable-ipc-flooding-protection',
                '--remote-debugging-port=0',
                // Additional args to handle HTTP/2 protocol issues
                '--disable-http2',
                '--disable-spdy',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        };

        // For production, try to use system Chrome if available
        if (isProduction) {
            try {
                // Try to use system Chrome first
                browserOptions.executablePath = '/usr/bin/google-chrome-stable';
            } catch (error) {
                console.log('System Chrome not found, falling back to Puppeteer Chrome');
                // Fallback to Puppeteer's bundled Chrome with additional args
                browserOptions.args.push(
                    '--single-process',
                    '--no-zygote'
                );
            }
        }

        browser = await puppeteer.launch(browserOptions);

        // Enhanced page navigation with retry logic
        const { htmlContent, error: navigationError } = await navigateWithRetry(browser, url);

        if (navigationError) {
            throw navigationError;
        }

        // Run Lighthouse audit with enhanced error handling
        const auditResult = await runLighthouseWithRetry(browser, url);

        // Extract scores
        const scores = {
            performance: Math.round(auditResult.lhr.categories.performance.score * 100),
            accessibility: Math.round(auditResult.lhr.categories.accessibility.score * 100),
            seo: Math.round(auditResult.lhr.categories.seo.score * 100),
        };

        // Extract detailed issues for PDF report with HTML content for line mapping
        const issues = extractIssues(auditResult.lhr, htmlContent);

        // Organize issues by category for the requested output format
        const result = {
            url,
            scores,
            performance: issues.filter(issue => issue.category === 'Performance'),
            accessibility: issues.filter(issue => issue.category === 'Accessibility'),
            seo: issues.filter(issue => issue.category === 'SEO'),
            timestamp: new Date().toISOString(),
            totalIssues: issues.length
        };

        console.log(`✅ Audit completed for ${url} - P:${scores.performance} A:${scores.accessibility} S:${scores.seo}`);
        return result;

    } catch (error) {
        console.error(`❌ Lighthouse audit failed for ${url}:`, error.message);

        // Enhanced error handling for production issues
        if (error.message.includes('Failed to launch the browser process')) {
            const detailedError = `
Browser launch failed. This may be due to missing Chrome dependencies.

For Ubuntu/Debian servers, install required packages:
sudo apt-get update
sudo apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

Original error: ${error.message}
            `.trim();

            throw new Error(detailedError);
        }

        // Handle HTTP/2 protocol errors specifically
        if (error.message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
            error.message.includes('ERR_SPDY_PROTOCOL_ERROR') ||
            error.message.includes('Protocol error')) {
            throw new Error(`Website ${url} has HTTP/2 protocol issues. This can happen with some websites that have misconfigured HTTP/2 servers or strict bot detection. Please try again later or contact the website administrator if the issue persists.`);
        }

        throw new Error(`Failed to audit ${url}: ${error.message}`);
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                console.error('Error closing page:', closeError);
            }
        }
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
}

// Enhanced navigation function with retry logic
async function navigateWithRetry(browser, url, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let page;
        try {
            console.log(`Navigation attempt ${attempt} for ${url}`);
            page = await browser.newPage();

            // Set a realistic user agent and headers
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            });

            // Progressive timeout strategy
            const timeout = 30000 + (attempt - 1) * 10000; // 30s, 40s, 50s

            await page.goto(url, {
                waitUntil: 'networkidle2', // More lenient than networkidle0
                timeout: timeout
            });

            const htmlContent = await page.content();
            await page.close();

            console.log(`Successfully navigated to ${url} on attempt ${attempt}`);
            return { htmlContent, error: null };

        } catch (error) {
            lastError = error;
            console.error(`Navigation attempt ${attempt} failed for ${url}:`, error.message);

            if (page) {
                try {
                    await page.close();
                } catch (closeError) {
                    console.error('Error closing page during retry:', closeError);
                }
            }

            // If it's an HTTP/2 protocol error, don't retry
            if (error.message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
                error.message.includes('ERR_SPDY_PROTOCOL_ERROR')) {
                break;
            }

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                const delay = 2000 * attempt; // 2s, 4s, 6s
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return { htmlContent: null, error: lastError };
}

// Enhanced Lighthouse execution with retry logic
async function runLighthouseWithRetry(browser, url, maxRetries = 2) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Lighthouse attempt ${attempt} for ${url}`);

            const lighthouseOptions = {
                port: new URL(browser.wsEndpoint()).port,
                output: 'json',
                logLevel: 'info',
                onlyCategories: ['performance', 'accessibility', 'seo'],
                settings: {
                    // Additional settings to handle problematic sites
                    maxWaitForFcp: 30 * 1000,
                    maxWaitForLoad: 60 * 1000,
                    skipAudits: [
                        'screenshot-thumbnails',
                        'final-screenshot',
                        'network-requests'
                    ]
                }
            };

            const result = await lighthouse(url, lighthouseOptions);
            console.log(`Successfully completed Lighthouse audit for ${url} on attempt ${attempt}`);
            return result;

        } catch (error) {
            lastError = error;
            console.error(`Lighthouse attempt ${attempt} failed for ${url}:`, error.message);

            // If it's an HTTP/2 protocol error, don't retry
            if (error.message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
                error.message.includes('ERR_SPDY_PROTOCOL_ERROR')) {
                break;
            }

            // Wait before retrying
            if (attempt < maxRetries) {
                const delay = 3000 * attempt; // 3s, 6s
                console.log(`Waiting ${delay}ms before Lighthouse retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

function extractIssues(lhr, htmlContent) {
    const issues = [];

    // Process accessibility audits
    const accessibilityAudits = [
        'aria-allowed-attr',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-input-field-name',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'bypass',
        'color-contrast',
        'definition-list',
        'dlitem',
        'document-title',
        'duplicate-id-active',
        'duplicate-id-aria',
        'form-field-multiple-labels',
        'frame-title',
        'heading-order',
        'html-has-lang',
        'html-lang-valid',
        'image-alt',
        'input-image-alt',
        'label',
        'landmark-one-main',
        'link-name',
        'list',
        'listitem',
        'meta-refresh',
        'meta-viewport',
        'object-alt',
        'tabindex',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang'
    ];

    accessibilityAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.score !== null && audit.score < 1) {
            const issueData = processAudit(audit, 'Accessibility', htmlContent);
            if (issueData) {
                issues.push(issueData);
            }
        }
    });

    // Process performance audits
    const performanceAudits = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'first-meaningful-paint',
        'speed-index',
        'total-blocking-time',
        'cumulative-layout-shift',
        'server-response-time',
        'render-blocking-resources',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'unminified-css',
        'unminified-javascript'
    ];

    performanceAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.score !== null && audit.score < 0.9) {
            const issueData = processAudit(audit, 'Performance', htmlContent);
            if (issueData) {
                issues.push(issueData);
            }
        }
    });

    // Process SEO audits
    const seoAudits = [
        'document-title',
        'meta-description',
        'http-status-code',
        'link-text',
        'crawlable-anchors',
        'is-crawlable',
        'robots-txt',
        'image-alt',
        'hreflang',
        'canonical'
    ];

    seoAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.score !== null && audit.score < 1) {
            const issueData = processAudit(audit, 'SEO', htmlContent);
            if (issueData) {
                issues.push(issueData);
            }
        }
    });

    return issues;
}

function processAudit(audit, category, htmlContent) {
    if (!audit.details || !audit.details.items) {
        return {
            type: audit.title,
            category,
            description: audit.description,
            impact: getImpactLevel(audit.score),
            suggestion: audit.description,
            wcagCriteria: getWCAGCriteria(audit.id),
            elements: []
        };
    }

    const htmlLines = htmlContent ? htmlContent.split('\n') : [];
    const usedLineNumbers = new Set(); // Track used line numbers to avoid duplicates

    const elements = audit.details.items.map((item, index) => {
        const elementIdentifier = item.selector || item.url || item.source || item.snippet || item.node?.snippet || `Element ${index + 1}`;
        let lineNumber = 'N/A';
        let lineApproximate = false;

        if (htmlContent && elementIdentifier && typeof elementIdentifier === 'string') {
            lineNumber = findLineNumber(elementIdentifier, htmlLines, usedLineNumbers);
            if (lineNumber !== 'N/A') {
                lineApproximate = true;
                usedLineNumbers.add(lineNumber);
            }
        }

        return {
            element: elementIdentifier,
            line: lineNumber,
            lineApproximate,
            details: item.failureMessage || item.reason || audit.explanation
        };
    });

    return {
        type: audit.title,
        category,
        description: audit.description,
        impact: getImpactLevel(audit.score),
        suggestion: audit.description,
        wcagCriteria: getWCAGCriteria(audit.id),
        elements
    };
}

function findLineNumber(elementIdentifier, htmlLines, usedLineNumbers) {
    if (!elementIdentifier || !htmlLines.length) {
        return 'N/A';
    }

    // Clean up the element identifier for better matching
    let searchTerms = [];

    // If it's a CSS selector, try different approaches
    if (elementIdentifier.includes('#') || elementIdentifier.includes('.') || elementIdentifier.includes('[')) {
        // Extract parts for CSS selectors like "div.class-name" or "#id"
        const parts = elementIdentifier.split(/[\s>+~]/).filter(part => part.trim());
        searchTerms.push(...parts);

        // Also try the full selector
        searchTerms.push(elementIdentifier);
    } else if (elementIdentifier.includes('<') && elementIdentifier.includes('>')) {
        // If it's an HTML snippet, extract the tag and attributes
        const tagMatch = elementIdentifier.match(/<(\w+)[^>]*>/);
        if (tagMatch) {
            searchTerms.push(tagMatch[0]); // Full opening tag
            searchTerms.push(`<${tagMatch[1]}`); // Just tag name
        }

        // Extract attribute values
        const attrMatches = elementIdentifier.match(/(\w+)=["']([^"']+)["']/g);
        if (attrMatches) {
            attrMatches.forEach(attr => {
                const valueMatch = attr.match(/=["']([^"']+)["']/);
                if (valueMatch) {
                    searchTerms.push(valueMatch[1]);
                }
            });
        }
    } else {
        // For other cases, use the identifier as-is
        searchTerms.push(elementIdentifier);
    }

    // Remove duplicates and empty terms
    searchTerms = [...new Set(searchTerms.filter(term => term && term.trim()))];

    // Try to find the best match
    for (const searchTerm of searchTerms) {
        const lineIndex = htmlLines.findIndex((line, index) => {
            const lineNumber = index + 1;
            return !usedLineNumbers.has(lineNumber) &&
                line.toLowerCase().includes(searchTerm.toLowerCase().trim());
        });

        if (lineIndex !== -1) {
            return lineIndex + 1; // Convert to 1-based line number
        }
    }

    return 'N/A';
}

function getImpactLevel(score) {
    if (score === null) return 'Unknown';
    if (score < 0.5) return 'Critical';
    if (score < 0.9) return 'Moderate';
    return 'Minor';
}

function getWCAGCriteria(auditId) {
    const wcagMapping = {
        'aria-allowed-attr': '4.1.2 - Level A',
        'aria-hidden-body': '4.1.2 - Level A',
        'aria-hidden-focus': '4.1.2 - Level A',
        'aria-input-field-name': '4.1.2 - Level A',
        'aria-required-attr': '4.1.2 - Level A',
        'aria-required-children': '4.1.1 - Level A',
        'aria-required-parent': '4.1.1 - Level A',
        'aria-roles': '4.1.2 - Level A',
        'aria-valid-attr': '4.1.2 - Level A',
        'aria-valid-attr-value': '4.1.2 - Level A',
        'button-name': '4.1.2 - Level A',
        'bypass': '2.4.1 - Level A',
        'color-contrast': '1.4.3 - Level AA',
        'document-title': '2.4.2 - Level A',
        'duplicate-id-active': '4.1.1 - Level A',
        'duplicate-id-aria': '4.1.1 - Level A',
        'form-field-multiple-labels': '3.3.2 - Level A',
        'frame-title': '4.1.2 - Level A',
        'heading-order': '1.3.1 - Level A',
        'html-has-lang': '3.1.1 - Level A',
        'html-lang-valid': '3.1.1 - Level A',
        'image-alt': '1.1.1 - Level A',
        'input-image-alt': '1.1.1 - Level A',
        'label': '1.3.1 - Level A',
        'landmark-one-main': '1.3.6 - Level AAA',
        'link-name': '4.1.2 - Level A',
        'list': '1.3.1 - Level A',
        'listitem': '1.3.1 - Level A',
        'meta-refresh': '2.2.1 - Level A',
        'meta-viewport': '1.4.4 - Level AA',
        'object-alt': '1.1.1 - Level A',
        'tabindex': '2.4.3 - Level A',
        'td-headers-attr': '1.3.1 - Level A',
        'th-has-data-cells': '1.3.1 - Level A',
        'valid-lang': '3.1.2 - Level AA'
    };

    return wcagMapping[auditId] || 'General - Level A';
} 