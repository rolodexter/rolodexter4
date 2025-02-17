import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testBlobStorage() {
    try {
        console.log('Testing Vercel Blob Storage connection...');
        console.log('Using blob store:', process.env.BLOB_STORE_NAME);
        
        const testContent = 'Hello from local development! ' + new Date().toISOString();
        const { url } = await put('test/local-dev-test.txt', testContent, {
            access: 'public',
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        
        console.log('Successfully uploaded test file!');
        console.log('File URL:', url);
    } catch (error) {
        console.error('Error testing blob storage:', error);
    }
}

// Run the test
testBlobStorage().catch(console.error);