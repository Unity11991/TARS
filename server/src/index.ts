import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Attach API endpoints
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal AURA server error' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AURA VOICE AGENT BACKEND ONLINE`);
  console.log(`  Server Listening on: http://localhost:${PORT}`);
  console.log(`  Target Model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
  console.log(`  Groq API Key Configured: ${Boolean(process.env.GROQ_API_KEY)}`);
  console.log(`====================================================`);
});
