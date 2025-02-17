import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../utils/db';
import type { Task, Tag } from '@prisma/client';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const recentTasks = await prisma.task.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'PENDING' }
        ]
      },
      include: {
        tags: {
          select: {
            name: true,
            color: true
          }
        },
        document: {
          select: {
            title: true,
            path: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 10
    });

    const formattedTasks: TaskResponse[] = recentTasks.map(task => ({
      id: task.id,
      title: task.title || task.document?.title || 'Untitled Task',
      file_path: task.filePath || task.document?.path || '',
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      status: task.status.toLowerCase(),
      priority: task.priority,
      tags: task.tags
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