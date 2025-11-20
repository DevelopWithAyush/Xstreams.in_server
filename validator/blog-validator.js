import { body, param, query } from "express-validator";

// Helper function to create slug from title
const createSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const validateBlogCreate = () => {
    return [
        body("title")
            .isString()
            .withMessage("Title must be a string")
            .isLength({ min: 3, max: 100 })
            .withMessage("Title must be between 3 and 100 characters")
            .trim(),

        body("content")
            .isString()
            .withMessage("Content must be a string")
            .isLength({ min: 50 })
            .withMessage("Content must be at least 50 characters long")
            .trim(),

        body("excerpt")
            .optional()
            .isString()
            .withMessage("Excerpt must be a string")
            .isLength({ max: 200 })
            .withMessage("Excerpt cannot be more than 200 characters")
            .trim(),

        body("category")
            .isString()
            .withMessage("Category must be a string")
            .isLength({ min: 2, max: 50 })
            .withMessage("Category must be between 2 and 50 characters")
            .trim(),

        body("tags")
            .optional()
            .custom((value) => {
                // Handle both string and array inputs
                let tags;

                if (typeof value === 'string') {
                    // Split comma-separated string into array
                    tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                } else if (Array.isArray(value)) {
                    tags = value;
                } else if (value === undefined || value === null) {
                    return true; // Optional field
                } else {
                    throw new Error("Tags must be a string or array");
                }

                if (tags.length > 10) {
                    throw new Error("Maximum 10 tags allowed");
                }

                if (!tags.every(tag => typeof tag === 'string' && tag.trim().length > 0)) {
                    throw new Error("Each tag must be a non-empty string");
                }

                return true;
            })
            .withMessage("Tags must be a valid array or comma-separated string"),

        body("status")
            .optional()
            .isIn(['draft', 'published'])
            .withMessage("Status must be either 'draft' or 'published'"),

        body("author")
            .optional()
            .isString()
            .withMessage("Author must be a string")
            .trim(),

        // SEO Validation
        body("seo")
            .optional()
            .custom((value) => {
                if (value === undefined || value === null || value === '') {
                    return true; // Optional field
                }

                // If it's a string, try to parse it as JSON
                if (typeof value === 'string') {
                    try {
                        JSON.parse(value);
                        return true;
                    } catch (error) {
                        throw new Error("SEO data must be valid JSON");
                    }
                }

                // If it's an object, that's fine too
                if (typeof value === 'object') {
                    return true;
                }

                throw new Error("SEO data must be an object or valid JSON string");
            })
            .withMessage("SEO data must be valid JSON or object"),

        body("seo.metaTitle")
            .optional()
            .isString()
            .withMessage("Meta title must be a string")
            .isLength({ max: 60 })
            .withMessage("Meta title cannot be more than 60 characters")
            .trim(),

        body("seo.metaDescription")
            .optional()
            .isString()
            .withMessage("Meta description must be a string")
            .isLength({ max: 160 })
            .withMessage("Meta description cannot be more than 160 characters")
            .trim(),

        body("seo.metaKeywords")
            .optional()
            .custom((value) => {
                if (value === undefined || value === null) {
                    return true;
                }

                let keywords;
                if (typeof value === 'string') {
                    keywords = value.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
                } else if (Array.isArray(value)) {
                    keywords = value;
                } else {
                    throw new Error("Meta keywords must be an array or comma-separated string");
                }

                return keywords.every(kw => typeof kw === 'string');
            })
            .withMessage("Meta keywords must be an array or comma-separated string"),

        body("seo.focusKeyword")
            .optional()
            .isString()
            .withMessage("Focus keyword must be a string")
            .trim(),

        // Open Graph Validation
        body("seo.openGraph.title")
            .optional()
            .isString()
            .isLength({ max: 60 })
            .withMessage("OG title cannot be more than 60 characters"),

        body("seo.openGraph.description")
            .optional()
            .isString()
            .isLength({ max: 160 })
            .withMessage("OG description cannot be more than 160 characters"),

        // Twitter Validation
        body("seo.twitter.title")
            .optional()
            .isString()
            .isLength({ max: 70 })
            .withMessage("Twitter title cannot be more than 70 characters"),

        body("seo.twitter.description")
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage("Twitter description cannot be more than 200 characters"),
    ];
};

export const validateBlogUpdate = () => {
    return [
        param("slug")
            .isString()
            .withMessage("Slug must be a string")
            .isLength({ min: 1 })
            .withMessage("Slug is required"),

        body("title")
            .optional()
            .isString()
            .withMessage("Title must be a string")
            .isLength({ min: 3, max: 100 })
            .withMessage("Title must be between 3 and 100 characters")
            .trim(),

        body("content")
            .optional()
            .isString()
            .withMessage("Content must be a string")
            .isLength({ min: 50 })
            .withMessage("Content must be at least 50 characters long")
            .trim(),

        body("excerpt")
            .optional()
            .isString()
            .withMessage("Excerpt must be a string")
            .isLength({ max: 200 })
            .withMessage("Excerpt cannot be more than 200 characters")
            .trim(),

        body("category")
            .optional()
            .isString()
            .withMessage("Category must be a string")
            .isLength({ min: 2, max: 50 })
            .withMessage("Category must be between 2 and 50 characters")
            .trim(),

        body("tags")
            .optional()
            .custom((value) => {
                // Handle both string and array inputs
                if (value === undefined || value === null || value === '') {
                    return true; // Optional field
                }

                let tags;

                if (typeof value === 'string') {
                    // Split comma-separated string into array
                    tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                } else if (Array.isArray(value)) {
                    tags = value;
                } else {
                    throw new Error("Tags must be a string or array");
                }

                if (tags.length > 10) {
                    throw new Error("Maximum 10 tags allowed");
                }

                if (!tags.every(tag => typeof tag === 'string' && tag.trim().length > 0)) {
                    throw new Error("Each tag must be a non-empty string");
                }

                return true;
            })
            .withMessage("Tags must be a valid array or comma-separated string"),

        body("status")
            .optional()
            .isIn(['draft', 'published'])
            .withMessage("Status must be either 'draft' or 'published'"),

        body("author")
            .optional()
            .isString()
            .withMessage("Author must be a string")
            .trim(),

        // SEO Validation (all optional for update)
        body("seo.metaTitle")
            .optional()
            .isString()
            .isLength({ max: 60 })
            .withMessage("Meta title cannot be more than 60 characters"),

        body("seo.metaDescription")
            .optional()
            .isString()
            .isLength({ max: 160 })
            .withMessage("Meta description cannot be more than 160 characters"),
    ];
};

export const validateBlogDelete = () => {
    return [
        param("slug")
            .isString()
            .withMessage("Slug must be a string")
            .isLength({ min: 1 })
            .withMessage("Slug is required")
            .trim(),
    ];
};

export const validateGetBlog = () => {
    return [
        param("slug")
            .isString()
            .withMessage("Slug must be a string")
            .isLength({ min: 1 })
            .withMessage("Slug is required")
            .trim(),
    ];
};

export const validateGetAllBlogs = () => {
    return [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer"),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100"),

        query("status")
            .optional()
            .isIn(['draft', 'published', 'all'])
            .withMessage("Status must be 'draft', 'published', or 'all'"),

        query("category")
            .optional()
            .isString()
            .withMessage("Category must be a string")
            .trim(),

        query("tags")
            .optional()
            .isString()
            .withMessage("Tags must be a string")
            .trim(),

        query("search")
            .optional()
            .isString()
            .withMessage("Search must be a string")
            .trim(),

        query("sortBy")
            .optional()
            .isIn(['createdAt', 'updatedAt', 'publishedAt', 'views', 'title'])
            .withMessage("SortBy must be one of: createdAt, updatedAt, publishedAt, views, title"),

        query("sortOrder")
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage("SortOrder must be 'asc' or 'desc'"),
    ];
};

export const validateBlogSearch = () => {
    return [
        query("q")
            .isString()
            .withMessage("Search query must be a string")
            .isLength({ min: 1 })
            .withMessage("Search query is required")
            .trim(),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage("Limit must be between 1 and 50"),
    ];
};

// Helper function to generate slug (can be used in controller)
export { createSlug };
