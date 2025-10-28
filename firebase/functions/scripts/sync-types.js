/**
 * This script synchronizes schema types between Firebase Functions and the frontend app.
 * Run it with `npm run sync-types` to update the frontend types when backend schemas change.
 */

const fs = require('fs');
const path = require('path');

// Path configurations
const sourceFile = path.join(__dirname, '..', 'src', 'shared', 'schema.ts');
const targetDir = path.join(__dirname, '..', '..', '..', 'apps', 'web', 'src', 'types');
const targetFile = path.join(targetDir, 'firebase-schema.ts');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Read source schema file
const schemaContent = fs.readFileSync(sourceFile, 'utf8');

// Process the content to make it frontend-compatible
let processedContent = schemaContent
  // Add frontend-specific header
  .replace(/import { z } from 'zod';/, 
    `import { z } from 'zod';\n\n/**
 * IMPORTANT: This file is auto-generated from the Firebase Functions schema.
 * DO NOT EDIT DIRECTLY. Instead, edit the schema in the Firebase Functions
 * and run npm run sync-types to update this file.
 * 
 * @generated
 */`)
  // Replace Firestore Timestamp with frontend-compatible alternative
  .replace(/z.any\(\) \/\/ Firestore Timestamp/g, 
    'z.union([z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() })])');

// Write the processed content to the target file
fs.writeFileSync(targetFile, processedContent);

console.log(`Successfully synced schema types to: ${targetFile}`);