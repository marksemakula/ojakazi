import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import stampRouter from './routes/stamp';
import domainRouter from './routes/domain';
import usersRouter from './routes/users';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Global rate limit ────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/stamp', stampRouter);
app.use('/api/domain', domainRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
