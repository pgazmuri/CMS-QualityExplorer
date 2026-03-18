export async function register() {
  // Only run in the Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load OpenAI API key from .key file if env var not set
    try {
      const fs = await import('fs');
      const path = await import('path');
      const keyFile = path.join(process.cwd(), '.key');
      if (!process.env.OPENAI_API_KEY && fs.existsSync(keyFile)) {
        const key = fs.readFileSync(keyFile, 'utf-8').trim();
        if (key) {
          process.env.OPENAI_API_KEY = key;
          console.log('[Instrumentation] API key configured from local file');
        }
      }
    } catch {
      // .key file loading is best-effort
    }

    // Initialize DuckDB with all CMS data
    try {
      const { initializeDuckDB } = await import('./src/lib/duckdb/loader');
      await initializeDuckDB();
    } catch (err) {
      console.error('[Instrumentation] DuckDB initialization failed:', err);
    }
  }
}
