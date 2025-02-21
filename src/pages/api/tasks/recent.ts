import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import type { Task, Tag } from '@prisma/client';

interface TaskResponse {
  id: string;
  title: string;
  file_path: string;
  type: 'AGENT' | 'PROJECT';
  createdAt: Date;
  updatedAt: Date;
  status: string;
  priority: string;
  tags: Array<{
    name: string;
    color: string | null;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type = 'all', status = 'active' } = req.query;

  try {
    const whereClause: any = {};

    // Filter by type if specified
    if (type !== 'all') {
      whereClause.type = type.toString().toUpperCase();
    }

    // Filter by status
    if (status === 'active') {
      whereClause.OR = [
        { status: 'ACTIVE' },
        { status: 'PENDING' }
      ];
    } else if (status !== 'all') {
      whereClause.status = status.toString().toUpperCase();
    }

    const recentTasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        tags: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { updated_at: 'desc' }
      ],
      take: 20
    });

    const formattedTasks: TaskResponse[] = recentTasks.map(task => ({
      id: task.id,
      title: task.title,
      file_path: task.filePath,
      type: task.type as 'AGENT' | 'PROJECT',
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      status: task.status,
      priority: task.priority,
      tags: task.tags
    }));

    return res.status(200).json({
      tasks: formattedTasks,
      count: formattedTasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}