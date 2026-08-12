import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Attach API endpoints
app.use('/api', apiRouter);

// Serve client dist static files in production if available
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal TARS server error' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  TARS VOICE AGENT ONLINE`);
  console.log(`  Server Listening on: http://localhost:${PORT}`);
  console.log(`  Target Model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`);
  console.log(`  Groq API Key Configured: ${Boolean(process.env.GROQ_API_KEY)}`);
  console.log(`====================================================`);
});
