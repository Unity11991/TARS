import { Router } from 'express';
import { conversationStore } from '../conversations/conversationStore.js';
import { memoryManager } from '../memory/memoryManager.js';
import { getToolDefinitions, TOOLS } from '../tools/index.js';
import { GroqProvider } from '../ai/groqProvider.js';
import { DEFAULT_PERSONALITY, Message } from '../../../shared/types/index.js';

export const router = Router();
const aiProvider = new GroqProvider();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    agent: 'AURA',
    version: '1.0.0',
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    hasApiKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
    timestamp: Date.now(),
  });
});

// SSE Streaming AI Endpoint
router.post('/chat/stream', async (req, res) => {
  const { conversationId, userContent, personality, history = [] } = req.body;

  if (!userContent || typeof userContent !== 'string') {
    res.status(400).json({ error: 'User message content required' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const currentConvId = conversationId || 'conv-default';
  const userMsg: Message = {
    id: `msg-u-${Date.now()}`,
    role: 'user',
    content: userContent,
    timestamp: Date.now(),
  };

  conversationStore.addMessage(currentConvId, userMsg);

  const assistantMsgId = `msg-a-${Date.now()}`;
  let accumulatedText = '';

  try {
    await aiProvider.generateStream({
      personality: personality || DEFAULT_PERSONALITY,
      memories: memoryManager.getMemories(),
      messages: [...history, userMsg],
      onEvent: (event) => {
        if (event.type === 'token') {
          accumulatedText += event.content || '';
        }
        sendEvent({ ...event, messageId: assistantMsgId });
      },
    });

    // Save final assistant message to conversation store
    if (accumulatedText.trim()) {
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedText,
        timestamp: Date.now(),
      };
      conversationStore.addMessage(currentConvId, assistantMsg);
    }
  } catch (err: any) {
    sendEvent({ type: 'error', error: err.message || 'Stream generation error' });
  } finally {
    res.end();
  }
});

// Conversation Routes
router.get('/conversations', (req, res) => {
  res.json(conversationStore.listConversations());
});

router.post('/conversations', (req, res) => {
  const { title } = req.body;
  const conv = conversationStore.createConversation(title);
  res.status(201).json(conv);
});

router.get('/conversations/:id', (req, res) => {
  const conv = conversationStore.getConversation(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conv);
});

router.patch('/conversations/:id', (req, res) => {
  const { title } = req.body;
  const conv = conversationStore.renameConversation(req.params.id, title);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conv);
});

router.delete('/conversations/:id', (req, res) => {
  const success = conversationStore.deleteConversation(req.params.id);
  res.json({ success });
});

// Memory Routes
router.get('/memory', (req, res) => {
  res.json(memoryManager.getMemories());
});

router.post('/memory', (req, res) => {
  const { key, value, category } = req.body;
  if (!key || !value) {
    res.status(400).json({ error: 'Key and value required for memory' });
    return;
  }
  const item = memoryManager.addMemory(key, value, category);
  res.status(201).json(item);
});

router.delete('/memory/:id', (req, res) => {
  const success = memoryManager.deleteMemory(req.params.id);
  res.json({ success });
});

// Tools Routes
router.get('/tools', (req, res) => {
  res.json(getToolDefinitions());
});

router.post('/tools/:name', async (req, res) => {
  const toolName = req.params.name;
  if (!TOOLS[toolName]) {
    res.status(404).json({ error: `Tool ${toolName} not found` });
    return;
  }
  const result = await TOOLS[toolName].execute(req.body || {});
  res.json(result);
});
