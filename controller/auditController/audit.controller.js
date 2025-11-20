import { validationResult } from "express-validator";
import Audit from "../../model/audit.js";
import { runAudit } from "../../services/lighthouse.js";
import { runAudit as standaloneSingleAudit } from "../../services/runAudit.js";
import { auditWholeSite } from "../../services/auditWholeSite.js";
import { generatePDFReport, generateMultiPagePDFReport } from "../../services/pdfGenerator.js";
import { ErrorHandler, TryCatch } from "../../utility/utility.js";
import User from "../../model/user.js";

const auditCache = new Map();

export const singlePageAudit = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new ErrorHandler('Invalid URL format', 400));
    }


    const { websiteUrl } = req.body;

    const userId = req.user._id;

    let validUrl;
    try {
        validUrl = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch (error) {
        return next(new ErrorHandler('Invalid URL format', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // if (user.subscription === "FREE" && user.usedAuditCredit >= 5) {
    //     return next(new ErrorHandler('You have reached the maximum number of audits', 400));
    // }

    let auditResult;
    try {
        auditResult = await runAudit(validUrl.href);
    }
    catch (auditError) {
        console.error('Audit failed:', auditError.message);

        // Provide user-friendly error message
        if (auditError.message.includes('Browser launch failed')) {
            return next(new ErrorHandler('Website audit service is temporarily unavailable. Please try again later.', 503));
        }

        return next(new ErrorHandler(`Failed to audit website: ${auditError.message}`, 500));
    }

    const audit = await Audit.create({ websiteUrl, user });

    const auditId = audit._id.toString();
    auditCache.set(auditId, auditResult);

    // Remove the oldest audit if the cache size exceeds 50
    if (auditCache.size > 50) {
        const firstKey = auditCache.keys().next().value;
        auditCache.delete(firstKey);
    }
    // Extract issues by category from the issues array
    const allIssues = auditResult.issues || [];
    const performance = allIssues.filter(issue => issue.category === 'Performance');
    const accessibility = allIssues.filter(issue => issue.category === 'Accessibility');
    const seo = allIssues.filter(issue => issue.category === 'SEO');

    // Create the expected structure for compatibility
    const formattedAuditResult = {
        ...auditResult,
        performance,
        accessibility,
        seo
    };
    // All features are now free - no need to track credit usage


    res.status(201).json({
        success: true,
        data: {
            auditId,
            auditType: 'single',
            url: auditResult.url,
            scores: auditResult.scores,
            timestamp: auditResult.timestamp,
            auditResult: formattedAuditResult

        }
    });

})


export const getAuditReport = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new ErrorHandler('Report ID is required', 400));
    }

    const auditData = auditCache.get(id);

    if (!auditData) {
        return next(new ErrorHandler('Report not found', 404));
    }

    console.log(`Generating PDF report for: ${auditData.url}`);
    console.log('Raw audit data structure:', JSON.stringify(auditData, null, 2));

    // Transform the data to match what the PDF generator expects
    const allIssues = auditData.issues || [];
    const performance = allIssues.filter(issue => issue.category === 'Performance');
    const accessibility = allIssues.filter(issue => issue.category === 'Accessibility');
    const seo = allIssues.filter(issue => issue.category === 'SEO');

    const transformedData = {
        url: auditData.url,
        scores: auditData.scores,
        timestamp: auditData.timestamp,
        reportId: id,
        totalIssues: auditData.totalIssues || allIssues.length,
        issues: allIssues,
        performance: performance,
        accessibility: accessibility,
        seo: seo
    };

    console.log('Transformed data for PDF:', JSON.stringify(transformedData, null, 2));

    // Generate PDF
    const pdfBuffer = await generatePDFReport(transformedData, id);

    // Set headers for PDF download
    const filename = `accessibility-report-${new Date().toISOString().split('T')[0]}-${id.substring(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

})



export const multiPageAudit = TryCatch(async (req, res, next) => {
    const { websiteUrl, maxPages = 50 } = req.body;
    const userId = req.user._id;

    let validUrl;
    try {
        validUrl = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch (error) {
        return next(new ErrorHandler('Invalid URL format', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // All features are now free - no subscription restrictions

    let auditResult;

    try {
        auditResult = await auditWholeSite(validUrl.href, { maxPages });
    } catch (error) {
        return next(new ErrorHandler(`Failed to audit website: ${error.message}`, 500));
    }

    const audit = await Audit.create({ websiteUrl, user });
    const auditId = audit._id.toString();
    auditCache.set(auditId, auditResult);

    res.status(201).json({
        success: true,
        data: {
            auditId,
            auditType: 'whole-site',
            summary: auditResult.summary,
            metadata: auditResult.metadata,
            totalPages: auditResult.auditResults.length,
            errors: auditResult.errors.length,
            auditResult: auditResult
        }
    });
})


export const getMultiPageAuditReport = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new ErrorHandler('Report ID is required', 400));
    }

    const auditData = auditCache.get(id);

    if (!auditData) {
        return next(new ErrorHandler('Report not found', 404));
    }

    console.log(`Generating multi-page PDF report for: ${auditData.metadata.startUrl}`);
    console.log(`Report covers ${auditData.metadata.totalPagesAudited} pages with ${auditData.summary.totalIssues.critical + auditData.summary.totalIssues.moderate + auditData.summary.totalIssues.minor} total issues`);
    console.log('Multi-page audit data structure:', JSON.stringify(auditData, null, 2));

    // The multi-page data should already be in the correct format, but let's ensure it has all required fields
    const transformedData = {
        ...auditData,
        reportId: id
    };

    // Generate Multi-Page PDF
    const pdfBuffer = await generateMultiPagePDFReport(transformedData, id);

    // Set headers for PDF download
    const domain = new URL(auditData.metadata.startUrl).hostname.replace(/\./g, '-');
    const filename = `multi-page-accessibility-report-${domain}-${new Date().toISOString().split('T')[0]}-${id.substring(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

})