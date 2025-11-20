import mongoose from 'mongoose'

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        minlength: [50, 'Content must be at least 50 characters']
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: [200, 'Excerpt cannot be more than 200 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        lowercase: true,
        trim: true
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    author: {
        type: String,
        default: 'Admin',
        trim: true
    },
    featuredImage: {
        public_id: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            trim: true
        },
        altText: {
            type: String,
            trim: true
        },
        filename: {
            type: String,
            trim: true
        }
    },
    contentImages: [{
        public_id: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            trim: true
        },
        altText: {
            type: String,
            trim: true
        },
        filename: {
            type: String,
            trim: true
        }
    }],
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    seo: {
        // Basic SEO Meta Tags
        metaTitle: {
            type: String,
            trim: true,
            maxlength: [60, 'Meta title cannot be more than 60 characters']
        },
        metaDescription: {
            type: String,
            trim: true,
            maxlength: [160, 'Meta description cannot be more than 160 characters']
        },
        metaKeywords: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        focusKeyword: {
            type: String,
            trim: true,
            lowercase: true
        },
        canonicalUrl: {
            type: String,
            trim: true
        },
        robots: {
            index: {
                type: Boolean,
                default: true
            },
            follow: {
                type: Boolean,
                default: true
            },
            noarchive: {
                type: Boolean,
                default: false
            },
            nosnippet: {
                type: Boolean,
                default: false
            }
        },

        // Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
        openGraph: {
            title: {
                type: String,
                trim: true,
                maxlength: [60, 'OG title cannot be more than 60 characters']
            },
            description: {
                type: String,
                trim: true,
                maxlength: [160, 'OG description cannot be more than 160 characters']
            },
            image: {
                url: {
                    type: String,
                    trim: true
                },
                width: {
                    type: Number,
                    default: 1200
                },
                height: {
                    type: Number,
                    default: 630
                },
                altText: {
                    type: String,
                    trim: true
                }
            },
            url: {
                type: String,
                trim: true
            },
            type: {
                type: String,
                default: 'article',
                enum: ['article', 'website', 'blog']
            },
            siteName: {
                type: String,
                trim: true,
                default: 'Your Site Name'
            },
            locale: {
                type: String,
                default: 'en_US',
                trim: true
            },
            publishedTime: {
                type: Date
            },
            modifiedTime: {
                type: Date
            },
            section: {
                type: String,
                trim: true
            },
            tags: [{
                type: String,
                trim: true
            }]
        },

        // Twitter Cards
        twitter: {
            card: {
                type: String,
                enum: ['summary', 'summary_large_image', 'app', 'player'],
                default: 'summary_large_image'
            },
            title: {
                type: String,
                trim: true,
                maxlength: [70, 'Twitter title cannot be more than 70 characters']
            },
            description: {
                type: String,
                trim: true,
                maxlength: [200, 'Twitter description cannot be more than 200 characters']
            },
            image: {
                url: {
                    type: String,
                    trim: true
                },
                altText: {
                    type: String,
                    trim: true
                }
            },
            site: {
                type: String,
                trim: true,
                default: '@yourhandle'
            },
            creator: {
                type: String,
                trim: true,
                default: '@yourhandle'
            }
        },

        // Schema.org Structured Data
        schema: {
            type: {
                type: String,
                default: 'BlogPosting',
                enum: ['Article', 'BlogPosting', 'NewsArticle']
            },
            headline: {
                type: String,
                trim: true,
                maxlength: [110, 'Headline cannot be more than 110 characters']
            },
            alternativeHeadline: {
                type: String,
                trim: true
            },
            author: {
                name: {
                    type: String,
                    trim: true
                },
                url: {
                    type: String,
                    trim: true
                }
            },
            publisher: {
                name: {
                    type: String,
                    trim: true,
                    default: 'Your Site Name'
                },
                logo: {
                    type: String,
                    trim: true
                }
            },
            mainEntityOfPage: {
                type: String,
                trim: true
            },
            datePublished: {
                type: Date
            },
            dateModified: {
                type: Date
            },
            image: [{
                url: {
                    type: String,
                    trim: true
                },
                width: {
                    type: Number
                },
                height: {
                    type: Number
                }
            }],
            wordCount: {
                type: Number,
                default: 0
            }
        },

        // Additional SEO fields
        breadcrumbs: [{
            name: {
                type: String,
                trim: true
            },
            url: {
                type: String,
                trim: true
            }
        }],

        // SEO Analysis scores
        seoScore: {
            overall: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            },
            titleOptimization: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            },
            contentOptimization: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            },
            keywordDensity: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            }
        }
    },
    publishedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Indexes for better query performance
blogSchema.index({ slug: 1 })
blogSchema.index({ status: 1, publishedAt: -1 })
blogSchema.index({ category: 1, status: 1 })
blogSchema.index({ tags: 1, status: 1 })
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' })

// Virtual for reading time estimation
blogSchema.virtual('readingTime').get(function () {
    const wordsPerMinute = 200
    const wordCount = this.content ? this.content.split(' ').length : 0
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return readingTime || 1
})

// Simple pre-save middleware for basic fields only
blogSchema.pre('save', function (next) {
    try {
        // 1. Handle publishedAt when status changes
        if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
            this.publishedAt = new Date()
        }

        if (this.isModified('status') && this.status === 'draft') {
            this.publishedAt = null
        }

        // 2. Generate excerpt if not provided
        if (!this.excerpt && this.content) {
            const plainText = this.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            this.excerpt = plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText
        }

        next()
    } catch (error) {
        console.error('Error in pre-save middleware:', error)
        next(error)
    }
})

// Static method to initialize SEO data
blogSchema.statics.initializeSEO = function (blogData) {
    const { title, excerpt, slug, category, tags, author, content, featuredImage } = blogData

    // Create a safe SEO structure
    const seo = blogData.seo || {}

    // Basic SEO fields
    if (!seo.metaTitle && title) {
        seo.metaTitle = title.length > 60 ? title.substring(0, 57) + '...' : title
    }

    if (!seo.metaDescription && excerpt) {
        seo.metaDescription = excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt
    }

    if (!seo.metaKeywords) {
        seo.metaKeywords = []
    }

    if (!seo.canonicalUrl && slug) {
        seo.canonicalUrl = `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/blog/${slug}`
    }

    // Open Graph
    if (!seo.openGraph) {
        seo.openGraph = {}
    }

    if (!seo.openGraph.title && seo.metaTitle) {
        seo.openGraph.title = seo.metaTitle
    }

    if (!seo.openGraph.description && seo.metaDescription) {
        seo.openGraph.description = seo.metaDescription
    }

    if (!seo.openGraph.url && slug) {
        seo.openGraph.url = `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/blog/${slug}`
    }

    if (!seo.openGraph.section && category) {
        seo.openGraph.section = category
    }

    if (!seo.openGraph.tags) {
        seo.openGraph.tags = []
    }

    if (seo.openGraph.tags.length === 0 && tags && tags.length > 0) {
        seo.openGraph.tags = [...tags]
    }

    if (!seo.openGraph.image) {
        seo.openGraph.image = {}
    }

    if (featuredImage && featuredImage.url && !seo.openGraph.image.url) {
        seo.openGraph.image.url = featuredImage.url
        seo.openGraph.image.altText = featuredImage.altText || title
    }

    seo.openGraph.modifiedTime = new Date()

    // Set published time if status is published
    if (blogData.status === 'published') {
        seo.openGraph.publishedTime = new Date()
    }

    // Twitter
    if (!seo.twitter) {
        seo.twitter = {}
    }

    if (!seo.twitter.title && seo.metaTitle) {
        seo.twitter.title = seo.metaTitle.length > 70 ? seo.metaTitle.substring(0, 67) + '...' : seo.metaTitle
    }

    if (!seo.twitter.description && seo.metaDescription) {
        seo.twitter.description = seo.metaDescription.length > 200 ? seo.metaDescription.substring(0, 197) + '...' : seo.metaDescription
    }

    if (!seo.twitter.image) {
        seo.twitter.image = {}
    }

    if (featuredImage && featuredImage.url && !seo.twitter.image.url) {
        seo.twitter.image.url = featuredImage.url
        seo.twitter.image.altText = featuredImage.altText || title
    }

    // Schema.org
    if (!seo.schema) {
        seo.schema = {}
    }

    if (!seo.schema.headline && title) {
        seo.schema.headline = title.length > 110 ? title.substring(0, 107) + '...' : title
    }

    if (!seo.schema.author) {
        seo.schema.author = {}
    }

    if (!seo.schema.author.name && author) {
        seo.schema.author.name = author
    }

    if (!seo.schema.image) {
        seo.schema.image = []
    }

    if (featuredImage && featuredImage.url && seo.schema.image.length === 0) {
        seo.schema.image.push({
            url: featuredImage.url,
            width: 1200,
            height: 630
        })
    }

    // Calculate word count
    if (content) {
        const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        seo.schema.wordCount = plainText.split(' ').length
    }

    seo.schema.dateModified = new Date()

    // Set published date if status is published
    if (blogData.status === 'published') {
        seo.schema.datePublished = new Date()
    }

    return seo
}

// Static method to get all categories
blogSchema.statics.getCategories = function () {
    return this.distinct('category', { status: 'published' })
}

// Static method to get all tags
blogSchema.statics.getTags = function () {
    return this.distinct('tags', { status: 'published' })
}

// Static method to search blogs
blogSchema.statics.searchBlogs = function (query, limit = 10) {
    return this.find(
        {
            $and: [
                { status: 'published' },
                {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { content: { $regex: query, $options: 'i' } },
                        { excerpt: { $regex: query, $options: 'i' } },
                        { category: { $regex: query, $options: 'i' } },
                        { tags: { $in: [new RegExp(query, 'i')] } }
                    ]
                }
            ]
        },
        {
            title: 1,
            slug: 1,
            excerpt: 1,
            category: 1,
            tags: 1,
            publishedAt: 1,
            views: 1,
            featuredImage: 1
        }
    )
        .sort({ publishedAt: -1 })
        .limit(limit)
}

// Instance method to increment views
blogSchema.methods.incrementViews = function () {
    this.views = (this.views || 0) + 1
    return this.save()
}

// Instance method to generate JSON-LD structured data
blogSchema.methods.generateStructuredData = function () {
    const blogObj = this.toObject();
    const seo = blogObj.seo || {};
    const schema = seo.schema || {};
    const author = schema.author || {};
    const publisher = schema.publisher || {};
    const metaKeywords = seo.metaKeywords || [];
    const schemaImages = schema.image || [];

    return {
        "@context": "https://schema.org",
        "@type": schema.type || "BlogPosting",
        "headline": schema.headline || blogObj.title,
        "alternativeHeadline": schema.alternativeHeadline,
        "author": {
            "@type": "Person",
            "name": author.name || blogObj.author,
            "url": author.url
        },
        "publisher": {
            "@type": "Organization",
            "name": publisher.name || "Your Site Name",
            "logo": {
                "@type": "ImageObject",
                "url": publisher.logo
            }
        },
        "datePublished": schema.datePublished || blogObj.publishedAt,
        "dateModified": schema.dateModified || blogObj.updatedAt,
        "description": seo.metaDescription || blogObj.excerpt,
        "image": schemaImages.map(img => ({
            "@type": "ImageObject",
            "url": img.url,
            "width": img.width,
            "height": img.height
        })),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": schema.mainEntityOfPage || seo.canonicalUrl
        },
        "wordCount": schema.wordCount,
        "keywords": metaKeywords.join(', '),
        "articleSection": blogObj.category,
        "articleBody": blogObj.content,
        "url": seo.canonicalUrl
    }
}

// Instance method to generate complete SEO meta tags
blogSchema.methods.generateSEOTags = function () {
    const blogObj = this.toObject();
    const seo = blogObj.seo || {};
    const openGraph = seo.openGraph || {};
    const twitter = seo.twitter || {};
    const robots = seo.robots || {};
    const metaKeywords = seo.metaKeywords || [];
    const ogTags = openGraph.tags || [];
    const ogImage = openGraph.image || {};
    const twitterImage = twitter.image || {};

    return {
        // Basic meta tags
        title: seo.metaTitle || blogObj.title,
        meta: [
            { name: 'description', content: seo.metaDescription || blogObj.excerpt },
            { name: 'keywords', content: metaKeywords.join(', ') },
            { name: 'author', content: blogObj.author },
            { name: 'robots', content: `${robots.index !== false ? 'index' : 'noindex'},${robots.follow !== false ? 'follow' : 'nofollow'}${robots.noarchive ? ',noarchive' : ''}${robots.nosnippet ? ',nosnippet' : ''}` },

            // Open Graph tags
            { property: 'og:title', content: openGraph.title },
            { property: 'og:description', content: openGraph.description },
            { property: 'og:type', content: openGraph.type },
            { property: 'og:url', content: openGraph.url },
            { property: 'og:site_name', content: openGraph.siteName },
            { property: 'og:locale', content: openGraph.locale },
            { property: 'og:image', content: ogImage.url },
            { property: 'og:image:width', content: ogImage.width },
            { property: 'og:image:height', content: ogImage.height },
            { property: 'og:image:alt', content: ogImage.altText },
            { property: 'article:published_time', content: openGraph.publishedTime },
            { property: 'article:modified_time', content: openGraph.modifiedTime },
            { property: 'article:section', content: openGraph.section },
            ...ogTags.map(tag => ({ property: 'article:tag', content: tag })),

            // Twitter Card tags
            { name: 'twitter:card', content: twitter.card },
            { name: 'twitter:title', content: twitter.title },
            { name: 'twitter:description', content: twitter.description },
            { name: 'twitter:image', content: twitterImage.url },
            { name: 'twitter:image:alt', content: twitterImage.altText },
            { name: 'twitter:site', content: twitter.site },
            { name: 'twitter:creator', content: twitter.creator }
        ].filter(tag => tag.content), // Remove empty tags

        // Canonical URL
        link: [
            { rel: 'canonical', href: seo.canonicalUrl }
        ],

        // Structured data
        script: [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify(this.generateStructuredData())
            }
        ]
    }
}

const Blog = mongoose.model('Blog', blogSchema)

export default Blog 