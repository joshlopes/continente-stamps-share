import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createApp } from './Ui/Http/routes.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const app = createApp(prisma);

const port = parseInt(process.env.PORT || '4587');
console.log(`Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
