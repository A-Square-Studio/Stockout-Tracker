import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// POST /api/ask  (same path the frontend already uses)
router.post('/', async (req, res) => {
  const { question, items } = req.body as { question: string; items: unknown[] };
  if (!question) { res.status(400).json({ error: 'question is required.' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Secrets.' });
    return;
  }

  const client = new Anthropic({ apiKey });
  const dataJson = JSON.stringify(items ?? [], null, 2);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a supply-chain assistant. Answer questions about the stockout data below concisely (2-4 sentences max). Use backtick-wrapped part numbers when referencing SKUs.

Stockout data:
${dataJson}

Question: ${question}`,
      },
    ],
  });

  const text = message.content.find(b => b.type === 'text')?.text ?? '';
  res.json({ answer: text });
});

export default router;
