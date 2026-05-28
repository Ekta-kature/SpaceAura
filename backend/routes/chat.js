const router = require('express').Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, async (req, res) => {
  try {
    const convos = await prisma.conversation.findMany({
      where: { participants: { some: { id: req.user.id } } },
      include: {
        participants: { select: { id: true, name: true, avatar: true, role: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ conversations: convos });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/conversations', protect, async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: 'participantId required.' });
    if (participantId === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself.' });
    const existing = await prisma.conversation.findFirst({
      where: { AND: [{ participants: { some: { id: req.user.id } } }, { participants: { some: { id: participantId } } }] },
      include: { participants: { select: { id: true, name: true, avatar: true } } },
    });
    if (existing) return res.json({ conversation: existing, existing: true });
    const conv = await prisma.conversation.create({
      data: { participants: { connect: [{ id: req.user.id }, { id: participantId }] } },
      include: { participants: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ conversation: conv, existing: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, participants: { some: { id: req.user.id } } } });
    if (!conv) return res.status(403).json({ error: 'Access denied.' });
    const [messages, total] = await Promise.all([
      prisma.message.findMany({ where: { conversationId: req.params.id }, include: { sender: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' }, skip, take: parseInt(limit) }),
      prisma.message.count({ where: { conversationId: req.params.id } }),
    ]);
    await prisma.message.updateMany({ where: { conversationId: req.params.id, senderId: { not: req.user.id }, isRead: false }, data: { isRead: true } });
    res.json({ messages, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { content, type = 'TEXT' } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required.' });
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, participants: { some: { id: req.user.id } } } });
    if (!conv) return res.status(403).json({ error: 'Access denied.' });
    const message = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.user.id, content, type },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    await prisma.conversation.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    req.io?.to(req.params.id).emit('new_message', message);
    res.status(201).json({ message });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/unread', protect, async (req, res) => {
  try {
    const count = await prisma.message.count({ where: { isRead: false, senderId: { not: req.user.id }, conversation: { participants: { some: { id: req.user.id } } } } });
    res.json({ unreadCount: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
