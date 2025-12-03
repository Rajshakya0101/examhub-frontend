import { CallableRequest } from 'firebase-functions/v2/https';
import { storage, handleError, validateAuth } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';
import { v4 as uuidv4 } from 'uuid';

interface GenerateUploadUrlRequest {
  fileName: string;
  contentType: string;
  path: string;
}

/**
 * Function to generate a signed URL for uploading files to Firebase Storage
 */
export async function generateUploadUrl(request: CallableRequest<GenerateUploadUrlRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});
    
    // Get request parameters
    const { fileName, contentType, path } = request.data;
    
    if (!fileName || !contentType || !path) {
      throw new Error('fileName, contentType, and path are required');
    }
    
    // Sanitize the file name
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    
    // Generate a unique file path to prevent overwriting
    const uniqueId = uuidv4();
    const extension = sanitizedFileName.split('.').pop();
    const uniqueFileName = `${sanitizedFileName.split('.')[0]}_${uniqueId}.${extension}`;
    
    // Create the full path in storage
    const fullPath = `${path}/${uid}/${uniqueFileName}`;
    
    // Create a reference to the file
    const fileRef = storage.bucket().file(fullPath);
    
    // Generate a signed URL for uploading
    const [uploadUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });
    
    logger.info(`Generated upload URL for ${fullPath}`);
    
    // Return the upload URL and file metadata
    return {
      uploadUrl,
      fileMetadata: {
        fullPath,
        fileName: uniqueFileName,
        contentType,
        userId: uid,
        createdAt: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    return handleError(error);
  }
}