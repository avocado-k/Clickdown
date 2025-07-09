const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's workspaces
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    });

    res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create workspace
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        ownerId: req.user.id
      }
    });

    // Add user as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: req.user.id,
        workspaceId: workspace.id,
        role: 'owner'
      }
    });

    res.status(201).json({ workspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get workspace members
router.get('/:workspaceId/members', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({ members });
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Invite user to workspace
router.post('/:workspaceId/invite', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add user to workspace
    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspaceId,
        role: role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({ member });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove member from workspace
router.delete('/:workspaceId/members/:userId', authMiddleware, async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: workspaceId
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;