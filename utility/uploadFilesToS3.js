import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';
import { s3Client } from '../lib/s3Client.js';

// Load environment variables
dotenv.config();

/**
 * Determines the appropriate S3 folder based on file mimetype
 * @param {string} mimetype - The MIME type of the file
 * @returns {string} The appropriate folder path
 */
const getFolderPath = (mimetype) => {
    if (mimetype.startsWith('image/')) {
        return 'uploads/images/';
    } else if (mimetype.startsWith('video/')) {
        return 'uploads/videos/';
    } else if (
        mimetype === 'application/pdf' ||
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'application/vnd.ms-powerpoint' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
        return 'uploads/documents/';
    }
    return 'uploads/others/';
};

/**
 * Gets file extension from mimetype
 * @param {string} mimetype - The MIME type of the file
 * @param {string} originalname - Original filename
 * @returns {string} The file extension
 */
const getFileExtension = (mimetype, originalname) => {
    // First try to get extension from original filename
    const originalExtension = originalname.split('.').pop();
    if (originalExtension && originalExtension.length > 0 && originalExtension.length < 5) {
        return originalExtension;
    }

    // Fallback to common extensions based on mimetype
    const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };

    return mimeToExt[mimetype] || 'bin';
};

/**
 * Uploads multiple files to AWS S3
 * @param {Array} files - Array of file objects from multer
 * @returns {Promise<Array>} Array of objects with public_id and url
 */
const uploadFilesToS3 = async (files = []) => {
    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map((file) => {
        return new Promise(async (resolve, reject) => {
            try {
                const fileId = uuid();
                const extension = getFileExtension(file.mimetype, file.originalname);
                const folderPath = getFolderPath(file.mimetype);
                const key = `${folderPath}${fileId}.${extension}`;

                const params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
               
                };

                await s3Client.send(new PutObjectCommand(params));

                // Construct the URL based on bucket and region
                const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

                resolve({
                    public_id: fileId,
                    url
                });
            } catch (error) {
                reject(error);
            }
        });
    });

    try {
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        throw new Error(`Error uploading files to S3: ${error.message}`);
    }
};

export { uploadFilesToS3 }; 