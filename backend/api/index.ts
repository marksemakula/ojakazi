// Vercel serverless entry point — wraps the Express app as a function handler.
// All routes under /api/* are proxied here via vercel.json routes.
import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/app';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  app(req, res);
}
