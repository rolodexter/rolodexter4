import { readDirectory, readFileStats, readFile as readBlobFile } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

const isLocal = process.env.NODE_ENV === 'development';

export interface FileInfo {
  pathname: string;
  url?: string;
  uploadedAt?: Date;
  size?: number;
}

export async function readTaskDirectory(directory: string): Promise<FileInfo[]> {
  if (isLocal) {
    try {
      const fullPath = path.join(process.cwd(), directory);
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      return files
        .filter(file => file.isFile() && file.name.endsWith('.html'))
        .map(file => ({
          pathname: path.join(directory, file.name),
        }));
    } catch (error) {
      console.error(`Error reading local directory ${directory}:`, error);
      return [];
    }
  }
  
  try {
    const { blobs } = await readDirectory({ directory });
    return blobs;
  } catch (error) {
    console.error(`Error reading blob directory ${directory}:`, error);
    return [];
  }
}

export async function getFileStats(filePath: string): Promise<{ uploadedAt: Date }> {
  if (isLocal) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const stats = await fs.stat(fullPath);
      return {
        uploadedAt: stats.mtime,
      };
    } catch (error) {
      console.error(`Error getting local file stats ${filePath}:`, error);
      return { uploadedAt: new Date() };
    }
  }
  
  try {
    return await readFileStats(filePath);
  } catch (error) {
    console.error(`Error getting blob file stats ${filePath}:`, error);
    return { uploadedAt: new Date() };
  }
}

export async function readTaskFile(filePath: string): Promise<string> {
  if (isLocal) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Error reading local file ${filePath}:`, error);
      return '';
    }
  }
  
  try {
    return await readBlobFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading blob file ${filePath}:`, error);
    return '';
  }
}