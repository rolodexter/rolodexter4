import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { Task, Tag, TaskStatus, Priority } from '@prisma/client';

type TaskWithTags = Task & {
  tags: Tag[];
  metadata: {
    labels?: string[];
  } | null;
};

interface TaskResponse {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assignee: string | null;
  labels: string[];
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TaskResponse[] | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const tasks = await prisma.task.findMany({
      include: {
        tags: true
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 10
    });

    // Format tasks for display
    const formattedTasks: TaskResponse[] = (tasks as TaskWithTags[]).map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date?.toISOString() || null,
      assignee: task.assignee,
      labels: task.metadata?.labels || [],
      tags: task.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })),
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    return res.status(200).json(formattedTasks);
  } catch (error) {
    console.error('Failed to fetch recent tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}