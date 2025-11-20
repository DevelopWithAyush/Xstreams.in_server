import PDFKit from 'pdfkit';
import fs from 'fs';
import path from 'path';
import https from 'https';

export async function generatePDFReport(auditData, reportId) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('PDF Generation - Starting with data:', {
                url: auditData.url,
                hasScores: !!auditData.scores,
                hasPerformance: !!auditData.performance,
                hasAccessibility: !!auditData.accessibility,
                hasSeo: !!auditData.seo,
                hasIssues: !!auditData.issues,
                issuesLength: auditData.issues?.length || 0,
                performanceLength: auditData.performance?.length || 0,
                accessibilityLength: auditData.accessibility?.length || 0,
                seoLength: auditData.seo?.length || 0
            });

            const doc = new PDFKit({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Website Accessibility Report - Axto',
                    Author: 'Axto - Website Auditor',
                    Subject: `Audit Report for ${auditData.url}`,
                    Creator: 'Axto Auditor Tool'
                }
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            });
            doc.on('error', reject);

            // Download and add logo
            try {
                const logoBuffer = await downloadImage('https://res.cloudinary.com/drpaz9o8h/image/upload/v1749743161/logo_aicj23.png');

                // Header with logo
                generateHeader(doc, auditData, logoBuffer);
            } catch (error) {
                console.warn('Failed to load logo, generating header without logo:', error.message);
                generateHeader(doc, auditData);
            }

            // Summary Section
            generateSummary(doc, auditData);

            // Scores Section
            generateScores(doc, auditData);

            // Issues Section
            generateIssuesSection(doc, auditData);

            // Final Summary Section
            generateFinalSummary(doc, auditData);

            doc.end();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            console.error('Error stack:', error.stack);
            console.error('Audit data structure:', JSON.stringify(auditData, null, 2));
            reject(error);
        }
    });
}

function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

function checkPageSpace(doc, requiredSpace = 100) {
    if (doc.y + requiredSpace > 750) {
        doc.addPage();
        doc.y = 50;
        return true;
    }
    return false;
}

function generateHeader(doc, auditData, logoBuffer = null) {
    // Add logo if available
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, 50, 40, { width: 40, height: 40 });
        } catch (error) {
            console.warn('Failed to embed logo in PDF:', error.message);
        }
    }

    // Company name and title
    doc.fontSize(20)
        .fillColor('#2563eb')
        .text('Axto', logoBuffer ? 100 : 50, 45);

    doc.fontSize(24)
        .fillColor('#2563eb')
        .text('Website Accessibility Report', 50, 70, { align: 'center' });

    // URL and Date with proper spacing and text wrapping
    const beforeY = doc.y;
    doc.fontSize(12)
        .fillColor('#6b7280');

    doc.text(`URL: ${auditData.url}`, 50, 110, { width: 450, lineGap: 2 });
    doc.text(`Generated: ${new Date(auditData.timestamp).toLocaleString()}`, 50, doc.y + 5, { width: 450, lineGap: 2 });
    doc.text(`Report ID: ${auditData.reportId || 'N/A'}`, 50, doc.y + 5, { width: 450, lineGap: 2 });

    // Separator line
    doc.y += 15;
    doc.moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e5e7eb')
        .stroke();

    doc.y += 20;
}

function generateSummary(doc, auditData) {
    checkPageSpace(doc, 200);

    const startY = doc.y;

    doc.fontSize(16)
        .fillColor('#111827')
        .text('Executive Summary', 50, startY);

    doc.y = startY + 30;

    // Fixed text wrapping with proper line breaks and height calculation
    doc.fontSize(12)
        .fillColor('#374151');

    const beforeTextY = doc.y;
    doc.text(`This report contains a comprehensive analysis of ${auditData.url}`, 50, doc.y, { width: 470, lineGap: 3 });
    doc.text('for accessibility, performance, and SEO compliance.', 50, doc.y + 5, { width: 470, lineGap: 3 });
    doc.text('The audit identified the following issues:', 50, doc.y + 5, { width: 470, lineGap: 3 });

    doc.y += 20;

    // Summary stats in table format
    const issues = auditData.issues || [];
    const criticalIssues = issues.filter(issue => issue.impact === 'Critical').length;
    const moderateIssues = issues.filter(issue => issue.impact === 'Moderate').length;
    const minorIssues = issues.filter(issue => issue.impact === 'Minor').length;

    // Create summary table
    const tableData = [
        ['Issue Type', 'Count'],
        ['Total Issues Found', auditData.totalIssues.toString()],
        ['Critical Issues', criticalIssues.toString()],
        ['Moderate Issues', moderateIssues.toString()],
        ['Minor Issues', minorIssues.toString()]
    ];

    const tableHeight = drawSummaryTable(doc, doc.y, tableData);
    doc.y += tableHeight + 30;
}

function drawSummaryTable(doc, startY, data) {
    const tableWidth = 300;
    const colWidth = tableWidth / 2;
    const baseRowHeight = 25;
    let currentY = startY;
    const padding = 8;

    // Table borders and content
    data.forEach((row, index) => {
        // Calculate actual row height based on text content
        const maxTextHeight = Math.max(
            doc.heightOfString(row[0], { width: colWidth - padding }),
            doc.heightOfString(row[1], { width: colWidth - padding })
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        // Check if we need a new page
        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        // Draw row background for header
        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight)
                .fill('#f3f4f6');
        }

        // Draw cell borders
        doc.rect(50, currentY, colWidth, rowHeight)
            .stroke('#e5e7eb');
        doc.rect(50 + colWidth, currentY, colWidth, rowHeight)
            .stroke('#e5e7eb');

        // Add text with proper vertical centering
        const textColor = index === 0 ? '#111827' : '#374151';
        const fontSize = index === 0 ? 11 : 10;
        const textY = currentY + (rowHeight - maxTextHeight) / 2;

        doc.fontSize(fontSize)
            .fillColor(textColor)
            .text(row[0], 55, textY, { width: colWidth - 10, lineGap: 2 })
            .text(row[1], 55 + colWidth, textY, { width: colWidth - 10, lineGap: 2 });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function generateScores(doc, auditData) {
    checkPageSpace(doc, 150);

    const startY = doc.y;

    doc.fontSize(16)
        .fillColor('#111827')
        .text('Audit Scores', 50, startY);

    doc.y = startY + 30;

    // Create scores table
    const scoresData = [
        ['Category', 'Score', 'Status'],
        ['Accessibility', auditData.scores.accessibility.toString(), getScoreStatus(auditData.scores.accessibility)],
        ['Performance', auditData.scores.performance.toString(), getScoreStatus(auditData.scores.performance)],
        ['SEO', auditData.scores.seo.toString(), getScoreStatus(auditData.scores.seo)]
    ];

    const tableHeight = drawScoresTable(doc, doc.y, scoresData);
    doc.y += tableHeight + 30;
}

function drawScoresTable(doc, startY, data) {
    const tableWidth = 450;
    const colWidths = [150, 100, 200];
    const baseRowHeight = 30;
    let currentY = startY;
    const padding = 8;

    data.forEach((row, index) => {
        // Calculate row height based on content
        const maxTextHeight = Math.max(
            doc.heightOfString(row[0], { width: colWidths[0] - padding }),
            doc.heightOfString(row[2], { width: colWidths[2] - padding })
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        // Check pagination
        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        // Draw row background for header
        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight)
                .fill('#f3f4f6');
        }

        // Draw cell borders
        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight)
                .stroke('#e5e7eb');
            xPos += width;
        });

        // Add text content
        const textColor = index === 0 ? '#111827' : '#374151';
        const fontSize = index === 0 ? 12 : 11;
        const textY = currentY + (rowHeight - maxTextHeight) / 2;

        doc.fontSize(fontSize)
            .fillColor(textColor);

        xPos = 50;
        colWidths.forEach((width, colIndex) => {
            if (colIndex === 1 && index > 0) {
                // Special handling for score column with colored badge
                const score = parseInt(row[1]);
                const scoreColor = getScoreColor(score);
                const badgeHeight = 20;
                const badgeY = currentY + (rowHeight - badgeHeight) / 2;

                doc.rect(xPos + 15, badgeY, 70, badgeHeight)
                    .fill(scoreColor);
                doc.fillColor('#ffffff')
                    .fontSize(12)
                    .text(row[1], xPos + 20, badgeY + 4, { width: 60, align: 'center' });
            } else {
                doc.fillColor(textColor)
                    .text(row[colIndex], xPos + 5, textY, { width: width - 10, lineGap: 2 });
            }
            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function getScoreStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good - Needs Improvement';
    return 'Poor - Requires Attention';
}

function generateIssuesSection(doc, auditData) {
    checkPageSpace(doc, 100);
    const startY = doc.y;
    doc.fontSize(16)
        .fillColor('#111827')
        .text('Detailed Issues', 50, startY);
    doc.y = startY + 30;

    // Flatten issues from all categories: one row per element, with serial number
    // Ensure arrays exist before spreading
    const performance = auditData.performance || [];
    const accessibility = auditData.accessibility || [];
    const seo = auditData.seo || [];
    const allIssues = [...performance, ...accessibility, ...seo];
    const flattenedRows = [];
    let serial = 1;
    allIssues.forEach(issue => {
        if (issue.elements && issue.elements.length > 0) {
            issue.elements.forEach(element => {
                // Extract CSS classes from selector if available
                let cssClasses = '';
                if (element.element && typeof element.element === 'string') {
                    // Try to extract class from selector or snippet
                    const classMatch = element.element.match(/class=["']([^"']+)["']/) || element.element.match(/\.([\w-]+)/g);
                    if (classMatch) {
                        if (Array.isArray(classMatch)) {
                            cssClasses = classMatch.map(cls => cls.replace('.', '')).join(' ');
                        } else {
                            cssClasses = classMatch[1];
                        }
                    }
                }
                flattenedRows.push([
                    serial++,
                    issue.type,
                    issue.description,
                    issue.suggestion,
                    issue.wcagCriteria,
                    element.line,
                    cssClasses
                ]);
            });
        } else {
            // No elements, still show the issue
            flattenedRows.push([
                serial++,
                issue.type,
                issue.description,
                issue.suggestion,
                issue.wcagCriteria,
                'N/A',
                ''
            ]);
        }
    });

    // Table header
    const tableData = [
        ['S. No.', 'Issue Type', 'Description', 'Suggested Fix', 'WCAG', 'Line', 'CSS Classes'],
        ...flattenedRows
    ];

    drawFlatIssuesTable(doc, doc.y, tableData);
    doc.y += 30;
}

function drawFlatIssuesTable(doc, startY, data) {
    const tableWidth = 540;
    const colWidths = [30, 80, 120, 100, 60, 40, 70];
    const padding = 10;
    const rowMargin = 4;
    let currentY = startY;

    data.forEach((row, index) => {
        // Calculate cell heights
        const cellHeights = row.map((cell, colIndex) =>
            doc.heightOfString(cell ? cell.toString() : '', {
                width: colWidths[colIndex] - 2 * padding,
                lineGap: 2,
                lineBreak: true
            })
        );
        const rowHeight = Math.max(...cellHeights, 28) + 2 * padding;

        // Pagination
        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        // Header row background
        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight).fill('#f3f4f6');
        }

        // Draw cell borders and content
        let xPos = 50;
        row.forEach((cell, colIndex) => {
            doc.rect(xPos, currentY, colWidths[colIndex], rowHeight).stroke('#e5e7eb');
            const fontSize = index === 0 ? 9 : 8;
            const textColor = index === 0 ? '#111827' : '#374151';
            doc.fontSize(fontSize)
                .fillColor(textColor)
                .text(cell ? cell.toString() : '', xPos + padding, currentY + padding, {
                    width: colWidths[colIndex] - 2 * padding,
                    lineGap: 2,
                    lineBreak: true,
                    ellipsis: true
                });
            xPos += colWidths[colIndex];
        });
        currentY += rowHeight + rowMargin;
    });
    return currentY - startY;
}

function generateFinalSummary(doc, auditData) {
    // Add new page for final summary
    doc.addPage();
    doc.y = 50;

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Complete Issues Summary', 50, doc.y);

    doc.y += 30;

    // Calculate comprehensive statistics using flattened issues
    // Ensure arrays exist before spreading
    const performance = auditData.performance || [];
    const accessibility = auditData.accessibility || [];
    const seo = auditData.seo || [];
    const allIssues = [...performance, ...accessibility, ...seo];
    auditData.issues = allIssues; // Temporarily add for compatibility
    const stats = calculateComprehensiveStats(auditData);

    // Overall statistics table
    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Overall Statistics', 50, doc.y);

    doc.y += 20;

    const overallStatsData = [
        ['Metric', 'Value'],
        ['Total Issues Identified', stats.totalIssues.toString()],
        ['Total Elements Affected', stats.totalElements.toString()],
        ['Categories Analyzed', stats.categoriesCount.toString()]
    ];

    const overallTableHeight = drawSummaryTable(doc, doc.y, overallStatsData);
    doc.y += overallTableHeight + 30;

    // Issues by impact level table
    checkPageSpace(doc, 150);

    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Issues by Impact Level', 50, doc.y);

    doc.y += 20;

    const impactStatsData = [
        ['Impact Level', 'Count', 'Percentage'],
        ['Critical', stats.critical.count.toString(), `${stats.critical.percentage}%`],
        ['Moderate', stats.moderate.count.toString(), `${stats.moderate.percentage}%`],
        ['Minor', stats.minor.count.toString(), `${stats.minor.percentage}%`]
    ];

    const impactTableHeight = drawImpactTable(doc, doc.y, impactStatsData);
    doc.y += impactTableHeight + 30;

    // Issues by category table
    checkPageSpace(doc, 200);

    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Issues by Category', 50, doc.y);

    doc.y += 20;

    const categoryStatsHeader = [['Category', 'Total', 'Critical', 'Moderate', 'Minor', 'Elements']];
    const categoryStatsData = categoryStatsHeader.concat(
        Object.entries(stats.byCategory).map(([category, categoryStats]) => [
            category,
            categoryStats.total.toString(),
            categoryStats.critical.toString(),
            categoryStats.moderate.toString(),
            categoryStats.minor.toString(),
            categoryStats.elements.toString()
        ])
    );

    const categoryTableHeight = drawCategoryTable(doc, doc.y, categoryStatsData);
    doc.y += categoryTableHeight + 30;

    // Recommendations
    checkPageSpace(doc, 100);

    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Priority Recommendations', 50, doc.y);

    doc.y += 20;

    const recommendations = generateRecommendations(stats);
    recommendations.forEach((rec, index) => {
        checkPageSpace(doc, 40);

        const beforeY = doc.y;
        doc.fontSize(11)
            .fillColor('#374151')
            .text(`${index + 1}. ${rec}`, 70, doc.y, { width: 470, lineGap: 3 });

        doc.y += 5; // Add small gap between recommendations
    });

    // Footer
    doc.y += 20;
    doc.fontSize(10)
        .fillColor('#6b7280')
        .text('Generated by Axto - Website Auditor Tool', 50, doc.y, { align: 'center', width: 470 })
        .text(`Report generated on ${new Date().toLocaleString()}`, 50, doc.y + 15, { align: 'center', width: 470 });
}

function drawImpactTable(doc, startY, data) {
    const tableWidth = 350;
    const colWidths = [150, 100, 100];
    const baseRowHeight = 25;
    let currentY = startY;
    const padding = 6;

    data.forEach((row, index) => {
        // Calculate row height
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        // Check pagination
        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        // Header row
        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight)
                .fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight)
                .stroke('#e5e7eb');

            const fontSize = index === 0 ? 11 : 10;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            // Add impact color indicator for data rows
            if (colIndex === 0 && index > 0) {
                const impactColors = {
                    'Critical': '#dc2626',
                    'Moderate': '#f59e0b',
                    'Minor': '#10b981'
                };

                if (impactColors[row[0]]) {
                    const indicatorY = currentY + (rowHeight - 10) / 2;
                    doc.rect(xPos + 5, indicatorY, 10, 10)
                        .fill(impactColors[row[0]]);
                }

                doc.fontSize(fontSize)
                    .fillColor(textColor)
                    .text(row[colIndex], xPos + 20, textY, { width: width - 25 });
            } else {
                doc.fontSize(fontSize)
                    .fillColor(textColor)
                    .text(row[colIndex], xPos + 5, textY, { width: width - 10 });
            }

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function drawCategoryTable(doc, startY, data) {
    const tableWidth = 470;
    const colWidths = [100, 60, 60, 60, 60, 70];
    const baseRowHeight = 22;
    let currentY = startY;
    const padding = 4;

    data.forEach((row, index) => {
        // Calculate row height
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        // Check pagination
        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight)
                .fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight)
                .stroke('#e5e7eb');

            const fontSize = index === 0 ? 9 : 8;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            doc.fontSize(fontSize)
                .fillColor(textColor)
                .text(row[colIndex], xPos + 3, textY, {
                    width: width - 6,
                    align: colIndex === 0 ? 'left' : 'center',
                    lineGap: 1
                });

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function calculateComprehensiveStats(auditData) {
    // Ensure issues array exists
    const issues = auditData.issues || [];

    const stats = {
        totalIssues: issues.length,
        totalElements: issues.reduce((sum, issue) => sum + (issue.elements?.length || 0), 0),
        categoriesCount: [...new Set(issues.map(issue => issue.category))].length,
        critical: { count: 0, percentage: 0 },
        moderate: { count: 0, percentage: 0 },
        minor: { count: 0, percentage: 0 },
        byCategory: {}
    };

    // Calculate impact level statistics
    issues.forEach(issue => {
        const impact = issue.impact.toLowerCase();
        if (impact === 'critical') stats.critical.count++;
        else if (impact === 'moderate') stats.moderate.count++;
        else if (impact === 'minor') stats.minor.count++;

        // Calculate category statistics
        if (!stats.byCategory[issue.category]) {
            stats.byCategory[issue.category] = {
                total: 0,
                critical: 0,
                moderate: 0,
                minor: 0,
                elements: 0
            };
        }

        stats.byCategory[issue.category].total++;
        stats.byCategory[issue.category][impact]++;
        stats.byCategory[issue.category].elements += issue.elements?.length || 0;
    });

    // Calculate percentages
    if (stats.totalIssues > 0) {
        stats.critical.percentage = Math.round((stats.critical.count / stats.totalIssues) * 100);
        stats.moderate.percentage = Math.round((stats.moderate.count / stats.totalIssues) * 100);
        stats.minor.percentage = Math.round((stats.minor.count / stats.totalIssues) * 100);
    }

    return stats;
}

function generateRecommendations(stats) {
    const recommendations = [];

    if (stats.critical.count > 0) {
        recommendations.push(`Address ${stats.critical.count} critical issues immediately as they significantly impact user accessibility.`);
    }

    if (stats.moderate.count > 0) {
        recommendations.push(`Plan to resolve ${stats.moderate.count} moderate issues in the next development cycle.`);
    }

    // Category-specific recommendations
    Object.entries(stats.byCategory).forEach(([category, categoryStats]) => {
        if (categoryStats.critical > 0) {
            recommendations.push(`Focus on ${category.toLowerCase()} issues, particularly ${categoryStats.critical} critical items.`);
        }
    });

    if (stats.totalElements > 50) {
        recommendations.push('Consider implementing automated accessibility testing in your development workflow.');
    }

    recommendations.push('Regular accessibility audits should be conducted to maintain compliance and user experience.');

    return recommendations;
}

function getScoreColor(score) {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
}

function getImpactColor(impact) {
    switch (impact.toLowerCase()) {
        case 'critical': return '#dc2626';
        case 'moderate': return '#f59e0b';
        case 'minor': return '#10b981';
        default: return '#6b7280';
    }
}

/**
 * Generate PDF report for multi-page audit results
 * @param {Object} auditData - Multi-page audit data
 * @param {string} reportId - Report ID
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateMultiPagePDFReport(auditData, reportId) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFKit({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Multi-Page Website Accessibility Report - Axto',
                    Author: 'Axto - Website Auditor',
                    Subject: `Multi-Page Audit Report for ${auditData.metadata.startUrl}`,
                    Creator: 'Axto Auditor Tool'
                }
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            });
            doc.on('error', reject);

            // Download and add logo
            try {
                const logoBuffer = await downloadImage('https://res.cloudinary.com/drpaz9o8h/image/upload/v1749743161/logo_aicj23.png');
                generateMultiPageHeader(doc, auditData, reportId, logoBuffer);
            } catch (error) {
                console.warn('Failed to load logo, generating header without logo:', error.message);
                generateMultiPageHeader(doc, auditData, reportId);
            }

            // Executive Summary
            generateMultiPageExecutiveSummary(doc, auditData);

            // Site-wide Statistics
            generateSiteStatistics(doc, auditData);

            // Pages Overview
            generatePagesOverview(doc, auditData);

            // Detailed Issues by Page
            generateDetailedIssuesByPage(doc, auditData);

            // Best/Worst Pages Analysis
            generateBestWorstPagesAnalysis(doc, auditData);

            // Recommendations
            generateMultiPageRecommendations(doc, auditData);

            // Appendix - Failed Pages
            if (auditData.errors && auditData.errors.length > 0) {
                generateFailedPagesAppendix(doc, auditData);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

function generateMultiPageHeader(doc, auditData, reportId, logoBuffer = null) {
    // Add logo if available
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, 50, 40, { width: 40, height: 40 });
        } catch (error) {
            console.warn('Failed to embed logo in PDF:', error.message);
        }
    }

    // Company name and title
    doc.fontSize(20)
        .fillColor('#2563eb')
        .text('Axto', logoBuffer ? 100 : 50, 45);

    doc.fontSize(24)
        .fillColor('#2563eb')
        .text('Multi-Page Website Accessibility Report', 50, 70, { align: 'center' });

    // URL and Date with proper spacing
    doc.fontSize(12)
        .fillColor('#6b7280');

    doc.text(`Website: ${auditData.metadata.startUrl}`, 50, 110, { width: 450, lineGap: 2 });
    doc.text(`Generated: ${new Date(auditData.metadata.auditTimestamp).toLocaleString()}`, 50, doc.y + 5, { width: 450, lineGap: 2 });
    doc.text(`Report ID: ${reportId}`, 50, doc.y + 5, { width: 450, lineGap: 2 });
    doc.text(`Pages Audited: ${auditData.metadata.totalPagesAudited} of ${auditData.metadata.totalPagesDiscovered} discovered`, 50, doc.y + 5, { width: 450, lineGap: 2 });

    // Separator line
    doc.y += 15;
    doc.moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e5e7eb')
        .stroke();

    doc.y += 20;
}

function generateMultiPageExecutiveSummary(doc, auditData) {
    checkPageSpace(doc, 250);

    const startY = doc.y;

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Executive Summary', 50, startY);

    doc.y = startY + 35;

    doc.fontSize(12)
        .fillColor('#374151');

    doc.text(`This comprehensive multi-page audit analyzed ${auditData.metadata.totalPagesAudited} pages from ${auditData.metadata.startUrl}`, 50, doc.y, { width: 470, lineGap: 4 });
    doc.text(`out of ${auditData.metadata.totalPagesDiscovered} discovered pages. The audit examined each page for accessibility,`, 50, doc.y + 5, { width: 470, lineGap: 4 });
    doc.text('performance, and SEO compliance, providing detailed insights for site-wide improvements.', 50, doc.y + 5, { width: 470, lineGap: 4 });

    doc.y += 25;

    // Summary statistics table
    const summaryData = [
        ['Metric', 'Value'],
        ['Total Pages Audited', auditData.metadata.totalPagesAudited.toString()],
        ['Total Pages Discovered', auditData.metadata.totalPagesDiscovered.toString()],
        ['Failed Pages', auditData.errors.length.toString()],
        ['Average Performance Score', `${auditData.summary.averageScores.performance}/100`],
        ['Average Accessibility Score', `${auditData.summary.averageScores.accessibility}/100`],
        ['Average SEO Score', `${auditData.summary.averageScores.seo}/100`],
        ['Total Critical Issues', auditData.summary.totalIssues.critical.toString()],
        ['Total Moderate Issues', auditData.summary.totalIssues.moderate.toString()],
        ['Total Minor Issues', auditData.summary.totalIssues.minor.toString()]
    ];

    const tableHeight = drawSummaryTable(doc, doc.y, summaryData);
    doc.y += tableHeight + 30;
}

function generateSiteStatistics(doc, auditData) {
    doc.addPage();
    doc.y = 50;

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Site-wide Statistics', 50, doc.y);

    doc.y += 30;

    // Calculate comprehensive statistics
    const stats = calculateMultiPageStats(auditData);

    // Average scores comparison chart (text-based)
    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Average Scores Across All Pages', 50, doc.y);

    doc.y += 20;

    const scoresData = [
        ['Category', 'Average Score', 'Best Page Score', 'Worst Page Score', 'Status'],
        ['Performance', `${auditData.summary.averageScores.performance}`, `${stats.bestScores.performance}`, `${stats.worstScores.performance}`, getScoreStatus(auditData.summary.averageScores.performance)],
        ['Accessibility', `${auditData.summary.averageScores.accessibility}`, `${stats.bestScores.accessibility}`, `${stats.worstScores.accessibility}`, getScoreStatus(auditData.summary.averageScores.accessibility)],
        ['SEO', `${auditData.summary.averageScores.seo}`, `${stats.bestScores.seo}`, `${stats.worstScores.seo}`, getScoreStatus(auditData.summary.averageScores.seo)]
    ];

    const scoresTableHeight = drawMultiPageScoresTable(doc, doc.y, scoresData);
    doc.y += scoresTableHeight + 30;

    // Issues distribution
    checkPageSpace(doc, 150);

    doc.fontSize(14)
        .fillColor('#1f2937')
        .text('Issues Distribution by Impact Level', 50, doc.y);

    doc.y += 20;

    const issuesData = [
        ['Impact Level', 'Total Count', 'Average per Page', 'Percentage'],
        ['Critical', auditData.summary.totalIssues.critical.toString(),
            Math.round(auditData.summary.totalIssues.critical / auditData.metadata.totalPagesAudited * 10) / 10,
            `${Math.round(auditData.summary.totalIssues.critical / (auditData.summary.totalIssues.critical + auditData.summary.totalIssues.moderate + auditData.summary.totalIssues.minor) * 100)}%`],
        ['Moderate', auditData.summary.totalIssues.moderate.toString(),
            Math.round(auditData.summary.totalIssues.moderate / auditData.metadata.totalPagesAudited * 10) / 10,
            `${Math.round(auditData.summary.totalIssues.moderate / (auditData.summary.totalIssues.critical + auditData.summary.totalIssues.moderate + auditData.summary.totalIssues.minor) * 100)}%`],
        ['Minor', auditData.summary.totalIssues.minor.toString(),
            Math.round(auditData.summary.totalIssues.minor / auditData.metadata.totalPagesAudited * 10) / 10,
            `${Math.round(auditData.summary.totalIssues.minor / (auditData.summary.totalIssues.critical + auditData.summary.totalIssues.moderate + auditData.summary.totalIssues.minor) * 100)}%`]
    ];

    const issuesTableHeight = drawImpactTable(doc, doc.y, issuesData);
    doc.y += issuesTableHeight + 30;
}

function generatePagesOverview(doc, auditData) {
    checkPageSpace(doc, 100);

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Pages Overview', 50, doc.y);

    doc.y += 25;

    doc.fontSize(12)
        .fillColor('#374151')
        .text('This section provides a summary of all audited pages, showing their individual scores and total issues.', 50, doc.y, { width: 470, lineGap: 3 });

    doc.y += 20;

    // Create pages overview table
    const headerData = [['Page URL', 'Performance', 'Accessibility', 'SEO', 'Total Issues', 'Critical']];

    const pagesData = auditData.auditResults.map(result => [
        result.url.length > 50 ? result.url.substring(0, 47) + '...' : result.url,
        result.scores.performance.toString(),
        result.scores.accessibility.toString(),
        result.scores.seo.toString(),
        result.totalIssues.toString(),
        [...result.performance, ...result.accessibility, ...result.seo]
            .filter(issue => issue.impact === 'Critical').length.toString()
    ]);

    const allPagesData = headerData.concat(pagesData);

    drawPagesOverviewTable(doc, doc.y, allPagesData);
}

function generateDetailedIssuesByPage(doc, auditData) {
    doc.addPage();
    doc.y = 50;

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Detailed Issues by Page', 50, doc.y);

    doc.y += 25;

    doc.fontSize(12)
        .fillColor('#374151')
        .text('The following section details all issues found on each page, organized by page URL.', 50, doc.y, { width: 470, lineGap: 3 });

    doc.y += 25;

    // Process each page
    auditData.auditResults.forEach((pageResult, pageIndex) => {
        // Check if we need a new page
        checkPageSpace(doc, 100);

        // Page header
        doc.fontSize(14)
            .fillColor('#1f2937')
            .text(`Page ${pageIndex + 1}: ${pageResult.url}`, 50, doc.y);

        doc.y += 20;

        // Page scores
        doc.fontSize(10)
            .fillColor('#6b7280')
            .text(`Performance: ${pageResult.scores.performance} | Accessibility: ${pageResult.scores.accessibility} | SEO: ${pageResult.scores.seo} | Total Issues: ${pageResult.totalIssues}`, 50, doc.y);

        doc.y += 20;

        // Collect all issues for this page
        const allIssues = [
            ...pageResult.performance.map(issue => ({ ...issue, pageUrl: pageResult.url })),
            ...pageResult.accessibility.map(issue => ({ ...issue, pageUrl: pageResult.url })),
            ...pageResult.seo.map(issue => ({ ...issue, pageUrl: pageResult.url }))
        ];

        if (allIssues.length === 0) {
            doc.fontSize(11)
                .fillColor('#10b981')
                .text('✅ No issues found on this page!', 70, doc.y);
            doc.y += 20;
        } else {
            // Create issues table for this page
            const issuesHeader = [['Issue Type', 'Category', 'Impact', 'Elements', 'Line', 'Description']];

            const issuesData = allIssues.map(issue => [
                issue.type.length > 30 ? issue.type.substring(0, 27) + '...' : issue.type,
                issue.category,
                issue.impact,
                issue.elements ? issue.elements.length.toString() : '0',
                issue.elements && issue.elements.length > 0 ? issue.elements[0].line : 'N/A',
                issue.description.length > 50 ? issue.description.substring(0, 47) + '...' : issue.description
            ]);

            const pageIssuesData = issuesHeader.concat(issuesData);

            const tableHeight = drawPageIssuesTable(doc, doc.y, pageIssuesData);
            doc.y += tableHeight + 20;
        }

        // Add separator line between pages
        if (pageIndex < auditData.auditResults.length - 1) {
            doc.y += 10;
            doc.moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .strokeColor('#e5e7eb')
                .stroke();
            doc.y += 15;
        }
    });
}

function generateBestWorstPagesAnalysis(doc, auditData) {
    checkPageSpace(doc, 200);

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Best and Worst Performing Pages', 50, doc.y);

    doc.y += 30;

    // Best performing page
    if (auditData.summary.bestPerformingPage) {
        doc.fontSize(14)
            .fillColor('#10b981')
            .text('🏆 Best Performing Page', 50, doc.y);

        doc.y += 20;

        const bestPageData = [
            ['Metric', 'Value'],
            ['URL', auditData.summary.bestPerformingPage.url],
            ['Performance Score', auditData.summary.bestPerformingPage.scores.performance.toString()],
            ['Accessibility Score', auditData.summary.bestPerformingPage.scores.accessibility.toString()],
            ['SEO Score', auditData.summary.bestPerformingPage.scores.seo.toString()],
            ['Average Score', Math.round((auditData.summary.bestPerformingPage.scores.performance +
                auditData.summary.bestPerformingPage.scores.accessibility +
                auditData.summary.bestPerformingPage.scores.seo) / 3).toString()]
        ];

        const bestTableHeight = drawSummaryTable(doc, doc.y, bestPageData);
        doc.y += bestTableHeight + 25;
    }

    // Worst performing page
    if (auditData.summary.worstPerformingPage) {
        checkPageSpace(doc, 150);

        doc.fontSize(14)
            .fillColor('#ef4444')
            .text('⚠️ Page Needing Most Attention', 50, doc.y);

        doc.y += 20;

        const worstPageData = [
            ['Metric', 'Value'],
            ['URL', auditData.summary.worstPerformingPage.url],
            ['Performance Score', auditData.summary.worstPerformingPage.scores.performance.toString()],
            ['Accessibility Score', auditData.summary.worstPerformingPage.scores.accessibility.toString()],
            ['SEO Score', auditData.summary.worstPerformingPage.scores.seo.toString()],
            ['Average Score', Math.round((auditData.summary.worstPerformingPage.scores.performance +
                auditData.summary.worstPerformingPage.scores.accessibility +
                auditData.summary.worstPerformingPage.scores.seo) / 3).toString()]
        ];

        const worstTableHeight = drawSummaryTable(doc, doc.y, worstPageData);
        doc.y += worstTableHeight + 25;
    }
}

function generateMultiPageRecommendations(doc, auditData) {
    checkPageSpace(doc, 150);

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Priority Recommendations', 50, doc.y);

    doc.y += 25;

    const recommendations = generateSiteWideRecommendations(auditData);

    recommendations.forEach((rec, index) => {
        checkPageSpace(doc, 40);

        doc.fontSize(11)
            .fillColor('#374151')
            .text(`${index + 1}. ${rec}`, 70, doc.y, { width: 470, lineGap: 3 });

        doc.y += 20;
    });

    // Footer
    doc.y += 20;
    doc.fontSize(10)
        .fillColor('#6b7280')
        .text('Generated by Axto - Website Auditor Tool', 50, doc.y, { align: 'center', width: 470 })
        .text(`Multi-page report generated on ${new Date().toLocaleString()}`, 50, doc.y + 15, { align: 'center', width: 470 });
}

function generateFailedPagesAppendix(doc, auditData) {
    doc.addPage();
    doc.y = 50;

    doc.fontSize(18)
        .fillColor('#111827')
        .text('Appendix: Failed Pages', 50, doc.y);

    doc.y += 25;

    doc.fontSize(12)
        .fillColor('#374151')
        .text('The following pages could not be audited due to technical issues:', 50, doc.y, { width: 470, lineGap: 3 });

    doc.y += 20;

    const failedPagesData = [
        ['URL', 'Error Message', 'Timestamp'],
        ...auditData.errors.map(error => [
            error.url.length > 40 ? error.url.substring(0, 37) + '...' : error.url,
            error.error.length > 50 ? error.error.substring(0, 47) + '...' : error.error,
            new Date(error.timestamp).toLocaleString()
        ])
    ];

    drawFailedPagesTable(doc, doc.y, failedPagesData);
}

// Helper functions for multi-page PDF generation

function calculateMultiPageStats(auditData) {
    const allScores = {
        performance: auditData.auditResults.map(r => r.scores.performance),
        accessibility: auditData.auditResults.map(r => r.scores.accessibility),
        seo: auditData.auditResults.map(r => r.scores.seo)
    };

    return {
        bestScores: {
            performance: Math.max(...allScores.performance),
            accessibility: Math.max(...allScores.accessibility),
            seo: Math.max(...allScores.seo)
        },
        worstScores: {
            performance: Math.min(...allScores.performance),
            accessibility: Math.min(...allScores.accessibility),
            seo: Math.min(...allScores.seo)
        }
    };
}

function drawMultiPageScoresTable(doc, startY, data) {
    const tableWidth = 520;
    const colWidths = [100, 80, 80, 80, 180];
    const baseRowHeight = 25;
    let currentY = startY;
    const padding = 5;

    data.forEach((row, index) => {
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight).fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight).stroke('#e5e7eb');

            const fontSize = index === 0 ? 10 : 9;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            doc.fontSize(fontSize)
                .fillColor(textColor)
                .text(row[colIndex], xPos + 3, textY, {
                    width: width - 6,
                    align: colIndex === 0 ? 'left' : 'center',
                    lineGap: 1
                });

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function drawPagesOverviewTable(doc, startY, data) {
    const tableWidth = 520;
    const colWidths = [160, 70, 70, 50, 70, 50];
    const baseRowHeight = 22;
    let currentY = startY;
    const padding = 4;

    data.forEach((row, index) => {
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight).fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight).stroke('#e5e7eb');

            const fontSize = index === 0 ? 9 : 8;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            doc.fontSize(fontSize)
                .fillColor(textColor)
                .text(row[colIndex], xPos + 2, textY, {
                    width: width - 4,
                    align: colIndex === 0 ? 'left' : 'center',
                    lineGap: 1,
                    ellipsis: true
                });

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function drawPageIssuesTable(doc, startY, data) {
    const tableWidth = 520;
    const colWidths = [90, 60, 60, 50, 40, 120];
    const baseRowHeight = 20;
    let currentY = startY;
    const padding = 3;

    data.forEach((row, index) => {
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight).fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight).stroke('#e5e7eb');

            const fontSize = index === 0 ? 8 : 7;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            // Add impact color indicator for impact column
            if (colIndex === 2 && index > 0) {
                const impactColors = {
                    'Critical': '#dc2626',
                    'Moderate': '#f59e0b',
                    'Minor': '#10b981'
                };

                if (impactColors[row[2]]) {
                    const indicatorY = currentY + (rowHeight - 8) / 2;
                    doc.rect(xPos + 2, indicatorY, 8, 8).fill(impactColors[row[2]]);
                }

                doc.fontSize(fontSize)
                    .fillColor(textColor)
                    .text(row[colIndex], xPos + 12, textY, {
                        width: width - 14,
                        align: 'left',
                        lineGap: 1,
                        ellipsis: true
                    });
            } else {
                doc.fontSize(fontSize)
                    .fillColor(textColor)
                    .text(row[colIndex], xPos + 2, textY, {
                        width: width - 4,
                        align: colIndex === 0 ? 'left' : 'center',
                        lineGap: 1,
                        ellipsis: true
                    });
            }

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function drawFailedPagesTable(doc, startY, data) {
    const tableWidth = 520;
    const colWidths = [180, 200, 140];
    const baseRowHeight = 25;
    let currentY = startY;
    const padding = 5;

    data.forEach((row, index) => {
        const maxTextHeight = Math.max(
            ...row.map((cell, colIndex) =>
                doc.heightOfString(cell, { width: colWidths[colIndex] - padding })
            )
        );
        const rowHeight = Math.max(baseRowHeight, maxTextHeight + padding);

        if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
        }

        if (index === 0) {
            doc.rect(50, currentY, tableWidth, rowHeight).fill('#f3f4f6');
        }

        let xPos = 50;
        colWidths.forEach((width, colIndex) => {
            doc.rect(xPos, currentY, width, rowHeight).stroke('#e5e7eb');

            const fontSize = index === 0 ? 10 : 9;
            const textColor = index === 0 ? '#111827' : '#374151';
            const textY = currentY + (rowHeight - doc.heightOfString(row[colIndex], { width: width - padding })) / 2;

            doc.fontSize(fontSize)
                .fillColor(textColor)
                .text(row[colIndex], xPos + 3, textY, {
                    width: width - 6,
                    align: 'left',
                    lineGap: 1,
                    ellipsis: true
                });

            xPos += width;
        });

        currentY += rowHeight;
    });

    return currentY - startY;
}

function generateSiteWideRecommendations(auditData) {
    const recommendations = [];
    const totalIssues = auditData.summary.totalIssues;
    const avgScores = auditData.summary.averageScores;

    // Priority recommendations based on issues
    if (totalIssues.critical > 0) {
        recommendations.push(`URGENT: Address ${totalIssues.critical} critical issues across all pages immediately. These significantly impact user accessibility and compliance.`);
    }

    if (totalIssues.moderate > 0) {
        recommendations.push(`Plan to resolve ${totalIssues.moderate} moderate issues in the next development cycle to improve overall site quality.`);
    }

    // Score-based recommendations
    if (avgScores.accessibility < 80) {
        recommendations.push('Focus on accessibility improvements across all pages. Consider implementing automated accessibility testing in your development workflow.');
    }

    if (avgScores.performance < 70) {
        recommendations.push('Performance optimization is needed site-wide. Consider implementing image optimization, code minification, and caching strategies.');
    }

    if (avgScores.seo < 80) {
        recommendations.push('SEO improvements needed across multiple pages. Ensure consistent meta descriptions, titles, and proper HTML structure.');
    }

    // Site-wide recommendations
    if (auditData.metadata.totalPagesAudited > 10) {
        recommendations.push('Implement a continuous monitoring system to catch issues early as your site grows.');
    }

    if (auditData.errors.length > 0) {
        recommendations.push(`Investigate and fix ${auditData.errors.length} pages that failed to audit to ensure complete site coverage.`);
    }

    recommendations.push('Establish regular accessibility audits (monthly/quarterly) to maintain compliance and user experience standards.');

    return recommendations;
} 