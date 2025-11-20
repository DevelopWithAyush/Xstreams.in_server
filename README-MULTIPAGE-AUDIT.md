# 🚀 Multi-Page Website Auditor

This enhanced auditing system can crawl and audit entire websites automatically, supporting both single-page and multi-page audits using Puppeteer and Lighthouse.

## 📁 System Architecture

```
server/
├── services/
│   ├── crawler.js          # Website crawler for discovering internal URLs
│   ├── runAudit.js         # Standalone single-page audit (refactored)
│   ├── auditWholeSite.js   # Orchestrator for multi-page audits
│   └── lighthouse.js       # Original lighthouse service (still used)
├── auditCLI.js            # Command-line interface
├── testAudit.js           # Test script
└── controller/auditController/
    └── audit.controller.js # Updated to support both audit types
```

## 🔧 Features

### ✅ Single Page Audit

- Performance, Accessibility, and SEO scores
- Detailed issue detection with line numbers
- Compatible with existing API

### ✅ Multi-Page Audit (NEW)

- Crawls entire website (max 50-100 pages)
- Audits all discovered internal pages
- Provides comprehensive site-wide statistics
- Saves results to JSON files
- Shows best/worst performing pages

## 🚀 Usage

### CLI Usage

```bash
# Single page audit
node auditCLI.js https://example.com --single

# Whole site audit (default)
node auditCLI.js https://example.com

# Whole site audit with options
node auditCLI.js https://example.com --maxPages=20 --save --output=./reports
```

### API Usage

#### Single Page Audit (Existing)

```javascript
POST /api/audit
{
  "websiteUrl": "https://example.com",
  "auditType": "single"
}
```

#### Multi-Page Audit (NEW)

```javascript
POST /api/audit
{
  "websiteUrl": "https://example.com",
  "auditType": "whole-site",
  "maxPages": 50
}
```

### Programmatic Usage

```javascript
import { auditWholeSite } from "./services/auditWholeSite.js";
import { runAudit } from "./services/runAudit.js";

// Single page audit
const singleResult = await runAudit("https://example.com");

// Multi-page audit
const multiResults = await auditWholeSite("https://example.com", {
  maxPages: 50,
  saveToFile: true,
  outputDir: "./output",
});
```

## 📊 Output Format

### Single Page Result

```json
{
  "url": "https://example.com",
  "scores": {
    "performance": 85,
    "accessibility": 92,
    "seo": 78
  },
  "performance": [...],
  "accessibility": [...],
  "seo": [...],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalIssues": 15
}
```

### Multi-Page Result

```json
{
  "summary": {
    "averageScores": {
      "performance": 82,
      "accessibility": 89,
      "seo": 85
    },
    "totalIssues": {
      "critical": 3,
      "moderate": 12,
      "minor": 25
    },
    "pageCount": 15,
    "bestPerformingPage": {
      "url": "https://example.com/best",
      "scores": { "performance": 95, "accessibility": 98, "seo": 92 }
    },
    "worstPerformingPage": {
      "url": "https://example.com/worst",
      "scores": { "performance": 65, "accessibility": 72, "seo": 68 }
    }
  },
  "auditResults": [
    // Array of individual page results
  ],
  "errors": [
    // Array of pages that failed to audit
  ],
  "metadata": {
    "startUrl": "https://example.com",
    "totalPagesDiscovered": 20,
    "totalPagesAudited": 18,
    "totalErrors": 2,
    "auditTimestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🧪 Testing

```bash
# Run the test suite
node testAudit.js

# Test individual components
node -e "import('./services/crawler.js').then(m => m.crawlWebsite('https://example.com', 5))"
```

## ⚙️ Configuration

### Environment Variables

- `NODE_ENV=production` - Uses system Chrome in production
- No additional environment variables required

### Crawler Settings

- **Max Pages**: 1-100 (default: 50)
- **Crawl Delay**: 500ms between page requests
- **Audit Delay**: 1000ms between audits
- **Retry Logic**: 1 retry attempt per failed page

### Excluded URLs

The crawler automatically excludes:

- Admin/login pages
- File downloads (PDF, images, etc.)
- External domains
- Search/cart/checkout pages

## 🔄 API Backward Compatibility

The existing single-page audit API remains fully compatible. New parameters are optional:

```javascript
// This still works exactly as before
POST /api/audit
{
  "websiteUrl": "https://example.com"
}

// This enables multi-page auditing
POST /api/audit
{
  "websiteUrl": "https://example.com",
  "auditType": "whole-site",
  "maxPages": 25
}
```

## 🎯 Next Steps

1. Test with your target website: `node auditCLI.js https://your-website.com`
2. Integrate into your existing workflow
3. Consider adding the multi-page option to your frontend
4. Customize crawling rules for your specific needs

## 🐛 Troubleshooting

**Chrome/Puppeteer Issues**: Ensure Chrome dependencies are installed
**Memory Issues**: Reduce `maxPages` for large sites
**Timeout Issues**: Check network connectivity and site performance
**Rate Limiting**: The system includes delays to be respectful to servers

For issues, check the console output for detailed error messages.
