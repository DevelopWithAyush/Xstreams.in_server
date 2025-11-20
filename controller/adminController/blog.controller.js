import Blog from "../../model/Blog.js";
import { TryCatch } from "../../utility/utility.js";
import { validationResult } from "express-validator";
import { createSlug } from "../../validator/blog-validator.js";
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../lib/s3Client.js';
import { uploadFilesToS3 } from "../../utility/uploadFilesToS3.js";

// Create a new blog
export const handleBlogCreate = TryCatch(async (req, res, next) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    let { title, content, excerpt, category, tags, status = 'draft', author, seo } = req.body;

    // Handle tags conversion from string to array if needed
    if (tags && typeof tags === 'string') {
        tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Handle SEO data parsing if it comes as JSON string
    if (seo && typeof seo === 'string') {
        try {
            seo = JSON.parse(seo);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid SEO data format. Must be valid JSON.",
                error: error.message
            });
        }
    }

    // Handle metaKeywords conversion from string to array if needed
    if (seo && seo.metaKeywords && typeof seo.metaKeywords === 'string') {
        seo.metaKeywords = seo.metaKeywords.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
    }

    // Generate slug from title
    let slug = createSlug(title);

    // Check if slug already exists and make it unique
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    const baseSlug = slug;

    while (existingBlog) {
        slug = `${baseSlug}-${counter}`;
        existingBlog = await Blog.findOne({ slug });
        counter++;
    }

    // Handle file uploads
    let featuredImageData = null;
    let contentImagesData = [];

    let blogData = {
        title,
        slug,
        content,
        excerpt,
        category: category.toLowerCase(),
        tags: tags ? tags.map(tag => tag.toLowerCase()) : [],
        status,
        author: author || 'Admin',
        featuredImage: null,
        contentImages: [],
        seo: seo || {}
    };

    try {
        // Upload featured image if provided
        if (req.files && req.files.featuredImage) {
            const uploadedFeatured = await uploadFilesToS3(req.files.featuredImage);
            if (uploadedFeatured.length > 0) {
                featuredImageData = {
                    public_id: uploadedFeatured[0].public_id,
                    url: uploadedFeatured[0].url,
                    altText: req.body.featuredImageAlt || title,
                    filename: req.files.featuredImage[0].originalname
                };
            }
        }

        // Upload content images if provided
        if (req.files && req.files.images) {
            const uploadedImages = await uploadFilesToS3(req.files.images);
            contentImagesData = uploadedImages.map((img, index) => ({
                public_id: img.public_id,
                url: img.url,
                altText: req.body[`imageAlt_${index}`] || `${title} - Image ${index + 1}`,
                filename: req.files.images[index].originalname
            }));
        } 
        blogData.featuredImage = featuredImageData;
        blogData.contentImages = contentImagesData;

        // Create blog data
       
    } catch (uploadError) {
        return res.status(500).json({
            success: false,
            message: "Error uploading files. Please check the file formats (allowed: jpg, jpeg, png) and ensure each file is under 5MB.",
            error: uploadError.message
        });
    }
        // Initialize SEO data safely before creating the blog
        blogData.seo = Blog.initializeSEO(blogData);

        const blog = await Blog.create(blogData);

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: {
                ...blog.toObject(),
                seoTags: blog.generateSEOTags(),
                structuredData: blog.generateStructuredData()
            }
        });

   
});

// Get all blogs with filtering, pagination, and search
export const handleGetAllBlogs = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }

    const {
        page = 1,
        limit = 10,
        status = 'all',
        category,
        tags,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Status filter
    if (status !== 'all') {
        query.status = status;
    }

    // Category filter
    if (category) {
        query.category = category.toLowerCase();
    }

    // Tags filter
    if (tags) {
        query.tags = { $in: [tags.toLowerCase()] };
    }

    // Search functionality
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const blogs = await Blog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'name email')
        .select('-content'); // Exclude full content for list view

    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
        success: true,
        blogs,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalBlogs: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    });
});

// Get single blog by slug
export const handleGetBlogDetails = TryCatch(async (req, res, next) => {


    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });

    if (!blog) {
        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });
    }

    // Increment views for published blogs
    if (blog.status === 'published') {
        await blog.incrementViews();
    }

    res.status(200).json({
        success: true,
        blog: {
            ...blog.toObject(),
            seoTags: blog.generateSEOTags(),
            structuredData: blog.generateStructuredData(),
            readingTime: blog.readingTime
        }
    });
});

// Update blog
export const handleUpdateBlog = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }

    const { slug } = req.params;
    const updateData = { ...req.body };

    // Handle tags conversion from string to array if needed
    if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Handle SEO data parsing if it comes as JSON string
    if (updateData.seo && typeof updateData.seo === 'string') {
        try {
            updateData.seo = JSON.parse(updateData.seo);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid SEO data format. Must be valid JSON.",
                error: error.message
            });
        }
    }

    // Handle metaKeywords conversion from string to array if needed
    if (updateData.seo && updateData.seo.metaKeywords && typeof updateData.seo.metaKeywords === 'string') {
        updateData.seo.metaKeywords = updateData.seo.metaKeywords.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
    }

    // Find existing blog
    const existingBlog = await Blog.findOne({ slug });
    if (!existingBlog) {
        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });
    }

    // Handle slug update if title is changed
    if (updateData.title && updateData.title !== existingBlog.title) {
        let newSlug = createSlug(updateData.title);

        // Check if new slug already exists
        let slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: existingBlog._id } });
        let counter = 1;
        const baseSlug = newSlug;

        while (slugExists) {
            newSlug = `${baseSlug}-${counter}`;
            slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: existingBlog._id } });
            counter++;
        }

        updateData.slug = newSlug;
    }

    // Process tags and category
    if (updateData.tags) {
        updateData.tags = updateData.tags.map(tag => tag.toLowerCase());
    }
    if (updateData.category) {
        updateData.category = updateData.category.toLowerCase();
    }

    // Handle file uploads
    try {
        // Update featured image if provided
        if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
            // Delete old featured image if exists
            if (existingBlog.featuredImage && existingBlog.featuredImage.public_id) {
                await deleteFileFromS3(existingBlog.featuredImage.public_id);
            }

            const uploadedFeatured = await uploadFilesToS3(req.files.featuredImage);
            if (uploadedFeatured.length > 0) {
                updateData.featuredImage = {
                    public_id: uploadedFeatured[0].public_id,
                    url: uploadedFeatured[0].url,
                    altText: req.body.featuredImageAlt || updateData.title || existingBlog.title,
                    filename: req.files.featuredImage[0].originalname
                };
            }
        }

        // Update content images if provided
        if (req.files && req.files.images && req.files.images.length > 0) {
            // Delete old content images
            if (existingBlog.contentImages && existingBlog.contentImages.length > 0) {
                for (const img of existingBlog.contentImages) {
                    await deleteFileFromS3(img.public_id);
                }
            }

            const uploadedImages = await uploadFilesToS3(req.files.images);
            updateData.contentImages = uploadedImages.map((img, index) => ({
                public_id: img.public_id,
                url: img.url,
                altText: req.body[`imageAlt_${index}`] || `${updateData.title || existingBlog.title} - Image ${index + 1}`,
                filename: req.files.images[index].originalname
            }));
        }

        // Initialize SEO data if any blog data has changed
        if (updateData.title || updateData.excerpt || updateData.slug || updateData.category || updateData.tags || updateData.author || updateData.content || updateData.featuredImage) {
            const completeData = { ...existingBlog.toObject(), ...updateData };
            updateData.seo = Blog.initializeSEO(completeData);
        }

        const updatedBlog = await Blog.findOneAndUpdate(
            { slug },
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog: {
                ...updatedBlog.toObject(),
                seoTags: updatedBlog.generateSEOTags(),
                structuredData: updatedBlog.generateStructuredData()
            }
        });

    } catch (uploadError) {
        return res.status(500).json({
            success: false,
            message: "Error updating files",
            error: uploadError.message
        });
    }
});

// Delete blog
export const handleDeleteBlog = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }

    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });
    }

    try {
        // Delete associated files from S3
        if (blog.featuredImage && blog.featuredImage.public_id) {
            await deleteFileFromS3(blog.featuredImage.public_id);
        }

        if (blog.contentImages && blog.contentImages.length > 0) {
            for (const img of blog.contentImages) {
                await deleteFileFromS3(img.public_id);
            }
        }

        // Delete blog from database
        await Blog.findOneAndDelete({ slug });

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });

    } catch (deleteError) {
        return res.status(500).json({
            success: false,
            message: "Error deleting blog files",
            error: deleteError.message
        });
    }
});

// Search blogs
export const handleBlogSearch = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }

    const { q: query, limit = 10 } = req.query;

    const blogs = await Blog.searchBlogs(query, parseInt(limit));

    res.status(200).json({
        success: true,
        query,
        results: blogs.length,
        blogs
    });
});

// Get blog categories
export const handleGetCategories = TryCatch(async (req, res, next) => {
    const categories = await Blog.getCategories();

    res.status(200).json({
        success: true,
        categories
    });
});

// Get blog tags
export const handleGetTags = TryCatch(async (req, res, next) => {
    const tags = await Blog.getTags();

    res.status(200).json({
        success: true,
        tags
    });
});

// Helper function to delete file from S3
const deleteFileFromS3 = async (publicId) => {
    try {
        // The publicId is the UUID, we need to find the file in S3
        // Since we don't store the exact key, we'll try common image extensions
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            try {
                const key = `uploads/images/${publicId}.${ext}`;
                const deleteParams = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: key
                };
                await s3Client.send(new DeleteObjectCommand(deleteParams));
                break; // If successful, break the loop
            } catch (error) {
                // Continue to next extension if file not found
                if (error.name !== 'NoSuchKey') {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        // Don't throw error as blog deletion should continue even if file deletion fails
    }
};