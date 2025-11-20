import { crawlWebsite } from './crawler.js';
import { runAudit } from './runAudit.js';
import fs from 'fs';
import path from 'path';

/**
 * Audit an entire website by crawling all pages and running audits
 * @param {string} startUrl - The starting URL to crawl from
 * @param {Object} options - Audit options
 * @param {number} options.maxPages - Maximum number of pages to crawl (default: 50)
 * @param {boolean} options.saveToFile - Whether to save results to file (default: false)
 * @param {string} options.outputDir - Output directory for results (default: './output')
 * @returns {Promise<Object>} Complete audit results for all pages
 */
export async function auditWholeSite(startUrl, options = {}) {
    const {
        maxPages = 50,
        saveToFile = false,
        outputDir = './output'
    } = options;

    console.log(`🚀 Starting whole site audit for: ${startUrl}`);
    console.log(`📊 Configuration: maxPages=${maxPages}, saveToFile=${saveToFile}`);

    try {
        // Step 1: Crawl the website to discover all internal URLs
        console.log('\n🕷️ Phase 1: Crawling website...');
        const urls = await crawlWebsite(startUrl, maxPages);

        if (urls.length === 0) {
            throw new Error('No pages found to audit. Please check the URL and try again.');
        }

        console.log(`\n🔍 Phase 2: Running audits on ${urls.length} pages...`);

        // Step 2: Run audits on all discovered URLs
        const auditResults = [];
        const errors = [];
        let completed = 0;

        for (const url of urls) {
            try {
                console.log(`\n[${completed + 1}/${urls.length}] 🔍 Auditing: ${url}`);

                const auditResult = await runAudit(url);
                auditResults.push(auditResult);
                completed++;

                // Show progress with scores
                const { performance, accessibility, seo } = auditResult.scores;
                console.log(`   ✅ Completed - Performance: ${performance}, Accessibility: ${accessibility}, SEO: ${seo}`);

            } catch (error) {
                console.error(`   ❌ Failed to audit ${url}: ${error.message}`);

                // Try once more before giving up
                try {
                    console.log(`   🔄 Retrying ${url}...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

                    const retryResult = await runAudit(url);
                    auditResults.push(retryResult);
                    completed++;

                    const { performance, accessibility, seo } = retryResult.scores;
                    console.log(`   ✅ Retry successful - Performance: ${performance}, Accessibility: ${accessibility}, SEO: ${seo}`);

                } catch (retryError) {
                    console.error(`   ❌ Retry failed for ${url}: ${retryError.message}`);
                    errors.push({
                        url,
                        error: retryError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Small delay between audits to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 3: Compile final results
        const summary = generateSiteSummary(auditResults, errors);
        const finalResults = {
            summary,
            auditResults,
            errors,
            metadata: {
                startUrl,
                totalPagesDiscovered: urls.length,
                totalPagesAudited: auditResults.length,
                totalErrors: errors.length,
                auditTimestamp: new Date().toISOString(),
                options: { maxPages, saveToFile }
            }
        };

        // Step 4: Save to file if requested
        if (saveToFile) {
            const filename = await saveResults(finalResults, outputDir);
            console.log(`💾 Results saved to: ${filename}`);
        }

        // Step 5: Display final summary
        displayFinalSummary(summary, auditResults.length, errors.length);

        return finalResults;

    } catch (error) {
        console.error(`🚨 Whole site audit failed: ${error.message}`);
        throw error;
    }
}

/**
 * Generate a summary of all audit results
 * @param {Array} auditResults - Array of audit results
 * @param {Array} errors - Array of errors encountered
 * @returns {Object} Summary statistics
 */
function generateSiteSummary(auditResults, errors) {
    if (auditResults.length === 0) {
        return {
            averageScores: { performance: 0, accessibility: 0, seo: 0 },
            totalIssues: { critical: 0, moderate: 0, minor: 0 },
            pageCount: 0
        };
    }

    // Calculate average scores
    const totalScores = auditResults.reduce((acc, result) => {
        acc.performance += result.scores.performance;
        acc.accessibility += result.scores.accessibility;
        acc.seo += result.scores.seo;
        return acc;
    }, { performance: 0, accessibility: 0, seo: 0 });

    const averageScores = {
        performance: Math.round(totalScores.performance / auditResults.length),
        accessibility: Math.round(totalScores.accessibility / auditResults.length),
        seo: Math.round(totalScores.seo / auditResults.length)
    };

    // Count total issues by impact level
    const totalIssues = auditResults.reduce((acc, result) => {
        const allIssues = [...result.performance, ...result.accessibility, ...result.seo];
        allIssues.forEach(issue => {
            if (issue.impact === 'Critical') acc.critical++;
            else if (issue.impact === 'Moderate') acc.moderate++;
            else if (issue.impact === 'Minor') acc.minor++;
        });
        return acc;
    }, { critical: 0, moderate: 0, minor: 0 });

    // Find best and worst performing pages
    const bestPage = auditResults.reduce((best, current) => {
        const currentAvg = (current.scores.performance + current.scores.accessibility + current.scores.seo) / 3;
        const bestAvg = (best.scores.performance + best.scores.accessibility + best.scores.seo) / 3;
        return currentAvg > bestAvg ? current : best;
    });

    const worstPage = auditResults.reduce((worst, current) => {
        const currentAvg = (current.scores.performance + current.scores.accessibility + current.scores.seo) / 3;
        const worstAvg = (worst.scores.performance + worst.scores.accessibility + worst.scores.seo) / 3;
        return currentAvg < worstAvg ? current : worst;
    });

    return {
        averageScores,
        totalIssues,
        pageCount: auditResults.length,
        bestPerformingPage: {
            url: bestPage.url,
            scores: bestPage.scores
        },
        worstPerformingPage: {
            url: worstPage.url,
            scores: worstPage.scores
        }
    };
}

/**
 * Save audit results to a JSON file
 * @param {Object} results - Complete audit results
 * @param {string} outputDir - Output directory
 * @returns {Promise<string>} Path to saved file
 */
async function saveResults(results, outputDir) {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename based on domain and timestamp
    const domain = new URL(results.metadata.startUrl).hostname.replace(/\./g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-result-${domain}-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    // Save the results
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

    return filepath;
}

/**
 * Display a final summary to the console
 * @param {Object} summary - Summary statistics
 * @param {number} totalAudited - Total pages audited
 * @param {number} totalErrors - Total errors encountered
 */
function displayFinalSummary(summary, totalAudited, totalErrors) {
    console.log('\n🎉 === WHOLE SITE AUDIT COMPLETE ===');
    console.log(`📊 Pages Audited: ${totalAudited}`);
    console.log(`❌ Pages Failed: ${totalErrors}`);
    console.log('\n📈 Average Scores:');
    console.log(`   🚀 Performance: ${summary.averageScores.performance}/100`);
    console.log(`   ♿ Accessibility: ${summary.averageScores.accessibility}/100`);
    console.log(`   🔍 SEO: ${summary.averageScores.seo}/100`);
    console.log('\n🐛 Total Issues Found:');
    console.log(`   🔴 Critical: ${summary.totalIssues.critical}`);
    console.log(`   🟡 Moderate: ${summary.totalIssues.moderate}`);
    console.log(`   🟢 Minor: ${summary.totalIssues.minor}`);

    if (summary.bestPerformingPage) {
        console.log(`\n🏆 Best Page: ${summary.bestPerformingPage.url}`);
        console.log(`   P:${summary.bestPerformingPage.scores.performance} A:${summary.bestPerformingPage.scores.accessibility} S:${summary.bestPerformingPage.scores.seo}`);
    }

    if (summary.worstPerformingPage) {
        console.log(`\n⚠️  Needs Attention: ${summary.worstPerformingPage.url}`);
        console.log(`   P:${summary.worstPerformingPage.scores.performance} A:${summary.worstPerformingPage.scores.accessibility} S:${summary.worstPerformingPage.scores.seo}`);
    }

    console.log('\n✨ Audit complete!');
} 