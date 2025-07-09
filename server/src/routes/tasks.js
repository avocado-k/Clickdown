const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get tasks for user's workspaces
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { workspaceId, projectId, status } = req.query;

    // Get user's workspaces
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: { workspaceId: true }
    });

    const workspaceIds = userWorkspaces.map(w => w.workspaceId);

    let whereClause = {
      project: {
        workspaceId: { in: workspaceIds }
      }
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, projectId, priority, startDate, dueDate, assigneeId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId: req.user.id
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority: priority || 'medium',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        type: 'created',
        content: `Task "${title}" was created`,
        taskId: task.id,
        userId: req.user.id
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, startDate, dueDate, assigneeId } = req.body;

    // Verify user has access to the task
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          workspace: {
            members: {
              some: {
                userId: req.user.id
              }
            }
          }
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Create activity log for status change
    if (status && status !== existingTask.status) {
      await prisma.taskActivity.create({
        data: {
          type: 'status_changed',
          content: `Status changed from "${existingTask.status}" to "${status}"`,
          taskId: task.id,
          userId: req.user.id
        }
      });
    }

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          workspace: {
            members: {
              some: {
                userId: req.user.id
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get projects for user's workspaces
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.query;

    // Get user's workspaces
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: { workspaceId: true }
    });

    const workspaceIds = userWorkspaces.map(w => w.workspaceId);

    let whereClause = {
      workspaceId: { in: workspaceIds }
    };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create project
router.post('/projects', authMiddleware, async (req, res) => {
  try {
    const { name, description, workspaceId, color } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'Name and workspace are required' });
    }

    // Verify user has access to the workspace
    const workspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: req.user.id,
        workspaceId: workspaceId
      }
    });

    if (!workspace) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
        color: color || '#10b981'
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete project
router.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id,
        workspace: {
          members: {
            some: {
              userId: req.user.id
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project has tasks
    const taskCount = await prisma.task.count({
      where: { projectId: id }
    });

    if (taskCount > 0) {
      return res.status(400).json({ message: 'Cannot delete project with existing tasks' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;