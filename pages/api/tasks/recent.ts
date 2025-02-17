import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../utils/db';

interface TaskResponse {
  id: string;
  title: string;
  file_path: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  tags: Array<{
    name: string;
    color: string | null;
  }>;
  priority: string;
}

interface TaskDocument {
  id: string;
  title: string;
  path: string;
  type: string;
  metadata: {
    status?: string;
    priority?: string;
  };
  created_at: Date;
  updated_at: Date;
  tags: Array<{
    name: string;
    color: string | null;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const recentTasks = await prisma.document.findMany({
      where: {
        type: 'task',
        path: {
          contains: '/tasks/'
        }
      },
      select: {
        id: true,
        title: true,
        path: true,
        type: true,
        metadata: true,
        created_at: true,
        updated_at: true,
        tags: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 10
    }) as TaskDocument[];

    // Transform the data to match the expected format
    const formattedTasks: TaskResponse[] = recentTasks.map(task => ({
      id: task.id,
      title: task.title,
      file_path: task.path,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      status: task.metadata?.status || 'active',
      tags: task.tags,
      priority: task.metadata?.priority || 'MEDIUM'
    }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ 
      message: 'Error fetching recent tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}