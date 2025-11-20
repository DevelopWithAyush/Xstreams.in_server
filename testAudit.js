import { auditWholeSite } from './services/auditWholeSite.js';
import { runAudit } from './services/runAudit.js';
import { crawlWebsite } from './services/crawler.js';

/**
 * Test script for the multi-page audit system
 */

async function testCrawler() {
    console.log('🧪 Testing Crawler...');
    try {
        const urls = await crawlWebsite('https://example.com', 5);
        console.log('✅ Crawler test passed!');
        console.log('Found URLs:', urls);
        return true;
    } catch (error) {
        console.error('❌ Crawler test failed:', error.message);
        return false;
    }
}

async function testSingleAudit() {
    console.log('\n🧪 Testing Single Page Audit...');
    try {
        const result = await runAudit('https://example.com');
        console.log('✅ Single audit test passed!');
        console.log('Scores:', result.scores);
        return true;
    } catch (error) {
        console.error('❌ Single audit test failed:', error.message);
        return false;
    }
}

async function testWholeSiteAudit() {
    console.log('\n🧪 Testing Whole Site Audit...');
    try {
        const results = await auditWholeSite('https://example.com', {
            maxPages: 3,
            saveToFile: false
        });
        console.log('✅ Whole site audit test passed!');
        console.log('Summary:', results.summary);
        return true;
    } catch (error) {
        console.error('❌ Whole site audit test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Multi-Page Audit System Tests\n');

    const results = {
        crawler: await testCrawler(),
        singleAudit: await testSingleAudit(),
        wholeSiteAudit: await testWholeSiteAudit()
    };

    console.log('\n📊 Test Results Summary:');
    console.log('Crawler:', results.crawler ? '✅ PASS' : '❌ FAIL');
    console.log('Single Audit:', results.singleAudit ? '✅ PASS' : '❌ FAIL');
    console.log('Whole Site Audit:', results.wholeSiteAudit ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(Boolean);
    console.log('\nOverall:', allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');

    process.exit(allPassed ? 0 : 1);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
} 