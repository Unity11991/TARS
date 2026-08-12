import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes/api.js';

export const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Attach API endpoints
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal TARS server error' });
});

export default app;
