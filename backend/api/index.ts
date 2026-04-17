// Vercel serverless entry point — wraps the Express app as a function handler.
// All routes under /api/* are proxied here via vercel.json rewrites.
import app from '../src/app';

export default app;
