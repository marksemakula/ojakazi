// Vercel serverless entry point.
// @vercel/node compiles this with esbuild (not tsc) so the rootDir
// restriction in tsconfig.json does not apply here.
import app from '../src/app';

export default app;
