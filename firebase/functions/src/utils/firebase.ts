import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export shared database references
export const db = getFirestore();
export const storage = getStorage();
export const serverTimestamp = FieldValue.serverTimestamp;

/**
 * Helper to validate that the caller is authenticated
 */
export const validateAuth = (auth: any): string => {
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  return auth.uid;
};

/**
 * Helper to validate that the user has required roles
 */
export const validateRole = async (
  uid: string, 
  requiredRoles: string[]
): Promise<void> => {
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data();
  const userRoles = userData?.roles as string[] || [];
  
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
  
  if (!hasRequiredRole) {
    throw new HttpsError('permission-denied', 'User does not have required permissions');
  }
};

/**
 * Helper to handle errors consistently
 */
export const handleError = (error: unknown): never => {
  console.error('Function error:', error);
  
  if (error instanceof HttpsError) {
    throw error;
  }
  
  throw new HttpsError(
    'internal',
    error instanceof Error ? error.message : 'Unknown error occurred'
  );
};