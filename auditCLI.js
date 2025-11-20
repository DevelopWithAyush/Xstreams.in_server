#!/usr/bin/env node

import { auditWholeSite } from './services/auditWholeSite.js';
import { runAudit } from './services/runAudit.js';

/**
 * CLI script to run website audits
 * Usage: node auditCLI.js <url> [options]
 * 
 * Examples:
 *   node auditCLI.js https://example.com
 *   node auditCLI.js https://example.com --maxPages=10
 *   node auditCLI.js https://example.com --single
 *   node auditCLI.js https://example.com --save
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🚀 Website Auditor CLI

Usage: node auditCLI.js <url> [options]

Options:
  --single          Run audit on single page only
  --maxPages=N      Maximum pages to crawl (default: 50)
  --save            Save results to file
  --output=DIR      Output directory (default: ./output)

Examples:
  node auditCLI.js https://example.com
  node auditCLI.js https://example.com --maxPages=10
  node auditCLI.js https://example.com --single
  node auditCLI.js https://example.com --save --output=./reports
        `);
        process.exit(1);
    }

    const url = args[0];
    const options = parseArgs(args.slice(1));

    try {
        // Validate URL
        new URL(url);

        if (options.single) {
            console.log('🔍 Running single page audit...');
            const result = await runAudit(url);
            console.log('\n✅ Single page audit completed!');
            console.log(`Performance: ${result.scores.performance}`);
            console.log(`Accessibility: ${result.scores.accessibility}`);
            console.log(`SEO: ${result.scores.seo}`);
            console.log(`Total Issues: ${result.totalIssues}`);
        } else {
            console.log('🕷️ Running whole site audit...');
            const results = await auditWholeSite(url, {
                maxPages: options.maxPages,
                saveToFile: options.save,
                outputDir: options.output
            });

            // The summary is already displayed by auditWholeSite
            console.log('\n🎯 Use the results programmatically or check saved file if --save was used.');
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
    const options = {
        single: false,
        maxPages: 50,
        save: false,
        output: './output'
    };

    args.forEach(arg => {
        if (arg === '--single') {
            options.single = true;
        } else if (arg === '--save') {
            options.save = true;
        } else if (arg.startsWith('--maxPages=')) {
            options.maxPages = parseInt(arg.split('=')[1]) || 50;
        } else if (arg.startsWith('--output=')) {
            options.output = arg.split('=')[1] || './output';
        }
    });

    return options;
}

// Run the CLI if this file is executed directly
main().catch(console.error); 