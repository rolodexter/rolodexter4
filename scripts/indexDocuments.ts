import fs from 'fs/promises';
import path from 'path';
import { parse } from 'node-html-parser';
import { initializeDatabase, upsertDocument } from '@/utils/db';

const DIRECTORIES_TO_SCAN = [
  'docs',
  'agents/memories',
  'agents/rolodexterVS/tasks'
];

async function findHtmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subDirFiles = await findHtmlFiles(fullPath);
        files.push(...subDirFiles);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return files;
}

async function extractContent(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const root = parse(content);
  
  // Remove script and style tags
  root.querySelectorAll('script, style').forEach(el => el.remove());
  
  // Get title from either title tag or first h1
  let title = root.querySelector('title')?.text || 
              root.querySelector('h1')?.text || 
              path.basename(filePath, '.html');
              
  // Get text content
  const textContent = root.text.trim();
  
  return {
    title: title.trim(),
    content: textContent,
    path: filePath
  };
}

async function main() {
  try {
    // Initialize database and create tables
    await initializeDatabase();
    
    // Find all HTML files
    const allFiles: string[] = [];
    for (const dir of DIRECTORIES_TO_SCAN) {
      if (await fs.access(dir).then(() => true).catch(() => false)) {
        const files = await findHtmlFiles(dir);
        allFiles.push(...files);
      } else {
        console.warn(`Directory ${dir} does not exist, skipping...`);
      }
    }
    
    console.log(`Found ${allFiles.length} HTML files to process`);
    
    // Process each file
    for (const file of allFiles) {
      try {
        const { title, content, path } = await extractContent(file);
        await upsertDocument({ title, content, path });
        console.log(`Indexed: ${path}`);
      } catch (error) {
        console.error(`Failed to process ${file}:`, error);
      }
    }
    
    console.log('Indexing complete!');
  } catch (error) {
    console.error('Failed to run indexing script:', error);
    process.exit(1);
  }
}

// Run the script
main(); 