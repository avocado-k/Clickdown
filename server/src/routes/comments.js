const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

// Get all comments for a task
router.get('/', authMiddleware, async (req, res) => {
  const { taskId } = req.params;

  try {
    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({ comments });
  } catch (error) {
    logger.error('Get comments error', { taskId, userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new comment
router.post('/', authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  try {
    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // Create activity log for the new comment
    await prisma.taskActivity.create({
      data: {
        type: 'commented',
        content: `commented: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        taskId: taskId,
        userId: req.user.id
      }
    });

    logger.info('Comment created', { commentId: comment.id, taskId, userId: req.user.id });
    res.status(201).json({ comment });
  } catch (error) {
    logger.error('Create comment error', { taskId, userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
