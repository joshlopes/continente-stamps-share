import { createContainer } from './container.js';
import { createApp } from './Ui/Http/routes.js';

const PORT = parseInt(process.env.PORT || '4587', 10);

async function main() {
  const container = createContainer();
  const app = createApp(container);

  console.log(`🚀 Server starting on port ${PORT}`);
  
  Bun.serve({
    port: PORT,
    fetch: app.fetch,
  });

  console.log(`✅ Server running at http://localhost:${PORT}`);
}

main().catch((error) => {
  console.error('Server Error:', error);
  process.exit(1);
});
