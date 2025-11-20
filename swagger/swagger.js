import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API documentation for Authentication and Mentor Onboarding',
        },
        servers: [
            {
                url: process.env.BASE_URL,
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        success: {
                            type: 'boolean',
                            description: 'Success status',
                        },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Success status',
                        },
                        message: {
                            type: 'string',
                            description: 'Success message',
                        },
                        user: {
                            type: 'object',
                            description: 'User profile data',
                        },
                    },
                },
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        join(__dirname, './**/*.yaml')
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
    // Swagger Page
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: "API Documentation"
    }));

    // Docs in JSON format
    app.get('/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`📚 Swagger docs available at /docs`);
};  