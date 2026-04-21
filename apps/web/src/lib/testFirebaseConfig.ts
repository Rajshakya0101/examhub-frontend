import { config } from 'dotenv';
import { resolve } from 'path';
import { verifyFirebaseConfig } from './firebaseVerify';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Define import.meta.env if running in Node.js
if (typeof import.meta === 'undefined') {
  // @ts-ignore
  globalThis.import = { meta: { env: process.env } };
}

/**
 * Run this file to test your Firebase configuration
 * You can run it with `npx tsx src/lib/testFirebaseConfig.ts`
 */
async function main() {
  console.log('Starting Firebase configuration verification...');
  
  // Log the available environment variables (sanitized)
  console.log('Available environment variables:');
  const envVars = process.env;
  Object.keys(envVars)
    .filter(key => key.startsWith('VITE_FIREBASE_'))
    .forEach(key => {
      const value = key === 'VITE_FIREBASE_API_KEY' 
        ? '[API KEY PROVIDED]' 
        : envVars[key];
      console.log(`${key}: ${value}`);
    });
  
  try {
    const result = await verifyFirebaseConfig();
    
    if (result.success) {
      console.log('\n✅ Firebase configuration is valid!\n');
      console.log('Available configuration:', result.config);
    } else {
      console.error('\n❌ Firebase configuration error:', result.message);
      console.error('Error code:', result.code);
      
      if (result.code === 'missing-config') {
        console.log('\n📝 Please check your .env.local file and make sure all required Firebase configuration values are set.');
      } else if (result.code === 'app/invalid-api-key') {
        console.log('\n📝 Your Firebase API key is invalid. Please check your .env.local file.');
      } else if (result.code === 'app/invalid-credential') {
        console.log('\n📝 Invalid credentials. Please check your Firebase API key and other configuration values.');
      } else if (result.code?.includes('config')) {
        console.log('\n📝 Firebase configuration problem. Check your .env.local file for proper formatting.');
        console.log('Example .env.local format:');
        console.log(`
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
VITE_FIREBASE_REGION=us-central1
        `);
      }
    }
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Execute the main function
main().catch(console.error);