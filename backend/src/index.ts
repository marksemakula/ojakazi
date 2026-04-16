import { pool } from './config/database';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function start() {
  // Verify DB connection
  try {
    await pool.query('SELECT 1');
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  });
}

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
});

start();
