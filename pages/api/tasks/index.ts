import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const tasksDir = path.join(process.cwd(), 'agents', 'rolodexterVS', 'tasks', 'active-tasks');
  const taskFiles = fs.readdirSync(tasksDir).slice(0, 20);
  const tasks = taskFiles.map(file => {
    const filePath = path.join(tasksDir, file);
    const fileStat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      id: file,
      title: file.replace(/\.[^/.]+$/, ""),
      status: "active",
      lastUpdated: fileStat.mtime ? fileStat.mtime.toISOString() : new Date().toISOString(),
      agent: "Unknown",
      systemArea: "UI",
      content
    };
  });
  res.status(200).json(tasks);
}