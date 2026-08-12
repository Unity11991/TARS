import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes/api.js';

export const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Mount API router on both '/api' and '/' to guarantee Vercel routing compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[TARS Unhandled Error]:', err);
  res.status(500).json({ error: err.message || 'Internal TARS server error' });
});

export default app;
