import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    type,           // 'task' | 'memory' | 'documentation'
    status,         // For tasks: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'ARCHIVED'
    tags,           // Comma-separated tag names
    search,         // Search term for title/content
    limit = 10,     // Number of results to return
    offset = 0      // Pagination offset
  } = req.query;

  try {
    const where: any = {};
    
    // Filter by type if specified
    if (type) {
      where.type = type;
    }

    // Filter by status for tasks
    if (status && type === 'task') {
      where.tasks = {
        some: {
          status: status
        }
      };
    }

    // Filter by tags if specified
    if (tags) {
      where.tags = {
        some: {
          name: {
            in: (tags as string).split(',')
          }
        }
      };
    }

    // Add search filter if specified
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.document.count({ where });

    // Get documents with tags
    const documents = await prisma.document.findMany({
      where,
      include: {
        tags: {
          select: {
            name: true,
            color: true
          }
        },
        tasks: {
          select: {
            status: true,
            priority: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    return res.status(200).json({
      total,
      documents,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ message: 'Error fetching documents' });
  }
}