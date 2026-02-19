import { PrismaClient } from '../generated/prisma/index.js';
import { createApp } from './Ui/Http/routes.js';

const prisma = new PrismaClient();
const app = createApp(prisma);

const port = parseInt(process.env.PORT || '4587');
console.log(`Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
