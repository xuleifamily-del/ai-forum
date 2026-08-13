import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { isDbAvailable } from './db/pool.js';
import questionsRouter from './routes/questions.js';
import answersRouter from './routes/answers.js';
import summariesRouter from './routes/summaries.js';
import feedbackRouter from './routes/feedback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '2mb' }));

// Health check (always available, reflects DB state).
app.get('/api/health', (req, res) => {
  res.json({ status: isDbAvailable ? 'ok' : 'degraded', db: isDbAvailable });
});

// When the database is unavailable, reject all other /api data routes with 503.
app.use('/api', (req, res, next) => {
  if (!isDbAvailable) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  next();
});

// API routes.
app.use('/api/questions', questionsRouter);
// answers & summaries are nested under /api/questions/:questionId/...
app.use('/api/questions', answersRouter);
app.use('/api/questions', summariesRouter);
app.use('/api/feedback', feedbackRouter);

// Production: serve the built SPA from dist/.
const isDev = process.env.NODE_ENV === 'development';
if (!isDev) {
  const distPath = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  // SPA catch-all: any non-/api GET serves index.html.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    res.status(404).send('Not found');
  });
}

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error('[server] Error:', err.message);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 5175;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(
      `[server] ai-forum API listening on http://localhost:${PORT} ` +
        `(db: ${isDbAvailable ? 'connected' : 'unavailable/degraded'})`
    );
  });
}

export default app;
