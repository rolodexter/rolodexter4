import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    type,
    status,
    tags,
    search,
    limit = 10,
    offset = 0,
    sortBy = 'updated_at',
    groupBy
  } = req.query;

  try {
    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    if (status && type === 'task') {
      where.tasks = {
        some: {
          status: status
        }
      };
    }

    if (tags) {
      where.tags = {
        some: {
          name: {
            in: (tags as string).split(',')
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    
    // Handle different sorting options
    switch (sortBy) {
      case 'priority':
        orderBy.tasks = {
          priority: 'desc'
        };
        break;
      case 'due_date':
        orderBy.tasks = {
          due_date: 'asc'
        };
        break;
      default:
        orderBy.updated_at = 'desc';
    }

    // Get documents with enhanced includes
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
            priority: true,
            due_date: true,
            completed_at: true,
            parent_id: true
          }
        },
        references: {
          select: {
            type: true,
            target_id: true
          }
        }
      },
      orderBy,
      take: Number(limit),
      skip: Number(offset)
    });

    // Handle grouping if specified
    let groupedDocuments = documents;
    if (groupBy) {
      const groups: Record<string, typeof documents> = {};
      
      switch (groupBy) {
        case 'status':
          documents.forEach(doc => {
            const status = doc.tasks?.[0]?.status || 'NO_STATUS';
            if (!groups[status]) groups[status] = [];
            groups[status].push(doc);
          });
          break;
        case 'priority':
          documents.forEach(doc => {
            const priority = doc.tasks?.[0]?.priority || 'NO_PRIORITY';
            if (!groups[priority]) groups[priority] = [];
            groups[priority].push(doc);
          });
          break;
        case 'tags':
          documents.forEach(doc => {
            doc.tags.forEach(tag => {
              if (!groups[tag.name]) groups[tag.name] = [];
              groups[tag.name].push(doc);
            });
          });
          break;
      }
      
      return res.status(200).json({
        total: documents.length,
        groups,
        groupBy,
        limit: Number(limit),
        offset: Number(offset)
      });
    }

    const total = await prisma.document.count({ where });

    return res.status(200).json({
      total,
      documents: groupedDocuments,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ message: 'Error fetching documents' });
  }
}